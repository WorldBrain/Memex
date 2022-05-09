import StorageManager, {
    isChildOfRelationship,
    getChildOfRelationshipTarget,
} from '@worldbrain/storex'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { setupSyncBackgroundTest } from '../../index.tests'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
    insertTestPages,
    insertReadwiseAPIKey,
} from './index.test.data'
import {
    DataChangeType,
    DataUsageAction,
    ContentLocatorFormat,
    PersonalDeviceType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    PersonalCloudUpdateBatch,
    PersonalCloudUpdateType,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { downloadClientUpdates } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import {
    cloudDataToReadwiseHighlight,
    formatReadwiseHighlightTag,
} from '@worldbrain/memex-common/lib/readwise-integration/utils'
import type { ReadwiseHighlight } from '@worldbrain/memex-common/lib/readwise-integration/api/types'
import { preprocessPulledObject } from '@worldbrain/memex-common/lib/personal-cloud/utils'
import { FakeFetch } from 'src/util/tests/fake-fetch'

// This exists due to inconsistencies between Firebase and Dexie when dealing with optional fields
//  - FB requires them to be `null` and excludes them from query results
//  - Dexie always includes `null` fields
// Running this function over the retrieved data ensures they are excluded in both cases
const deleteNullFields = <T = any>(obj: T): T => {
    for (const field in obj) {
        if (obj[field] === null) {
            delete obj[field]
        }
    }
    return obj
}

class IdCapturer {
    ids: { [collection: string]: Array<number | string> } = {}
    storageManager?: StorageManager

    constructor(
        public options?: {
            postprocesessMerge?: (params: {
                merged: { [collection: string]: { [name: string]: any } }
            }) => void
        },
    ) {}

    setup(storageManager: StorageManager) {
        this.storageManager = storageManager
    }

    handlePostStorageChange = async (event: StorageOperationEvent<'post'>) => {
        for (const change of event.info.changes) {
            if (change.type === 'create') {
                const ids = this.ids[change.collection] ?? []
                this.ids[change.collection] = ids
                ids.push(change.pk as number | string)
            }
        }
    }

    mergeIds<TestData>(
        testData: TestData,
        opts?: { skipTagType?: 'annotation' | 'page'; anyId?: boolean },
    ) {
        const source = testData as any
        const merged = {} as any
        for (const [collection, objects] of Object.entries(source)) {
            const mergedObjects = (merged[collection] = {})
            merged[collection] = mergedObjects

            let idsPicked = 0
            for (const [objectName, object] of Object.entries(objects)) {
                // This needs to exist as this method assumes the order of test data such that if IDs exist for later records, so do earlier ones.
                // The tags collection test data contains both annotation + page tags, but only one of these get tested at a time.
                if (
                    (opts?.skipTagType === 'annotation' &&
                        ['firstAnnotationTag', 'secondAnnotationTag'].includes(
                            objectName,
                        )) ||
                    (opts?.skipTagType === 'page' &&
                        ['firstPageTag', 'secondPageTag'].includes(objectName))
                ) {
                    continue
                }

                // pick IDs by looking at the IDs that were generated during object creation
                const id = opts?.anyId
                    ? expect.anything()
                    : this.ids[collection]?.[idsPicked++]

                const mergedObject = {
                    ...deleteNullFields(object),
                    id: id ?? object.id,
                    // TODO: set these here as I was encountering issues with test data timestamps getting out-of-sync - it would be nice to get this precision back
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                }
                const collectionDefinition = this.storageManager!.registry
                    .collections[collection]
                for (const relationship of collectionDefinition.relationships ??
                    []) {
                    if (isChildOfRelationship(relationship)) {
                        const targetCollection = getChildOfRelationshipTarget(
                            relationship,
                        )
                        const index = mergedObject[relationship.alias] - 1
                        const targetId = this.ids[targetCollection]?.[index]
                        mergedObject[relationship.alias] =
                            targetId ?? mergedObject[relationship.alias]
                    }
                }
                mergedObjects[objectName] = mergedObject
            }
        }
        this.options?.postprocesessMerge?.({
            merged,
        })
        return merged as TestData
    }
}

async function getDatabaseContents(
    storageManager: StorageManager,
    collections: string[],
    options?: { getWhere?(collection: string): any },
) {
    const contents: { [collection: string]: any[] } = {}
    await Promise.all(
        collections.map(async (collection) => {
            contents[collection] = (
                await storageManager
                    .collection(collection)
                    .findObjects(options?.getWhere?.(collection) ?? {}, {
                        order: [['createdWhen', 'asc']],
                    })
            ).map(deleteNullFields)
        }),
    )
    return contents
}

function getPersonalWhere(collection: string) {
    if (collection.startsWith('personal')) {
        return { user: TEST_USER.id }
    }
}

type DataChange = [
    /* type: */ DataChangeType,
    /* collection: */ string,
    /* id: */ string | number,
    /* info: */ any?,
]

function dataChanges(
    remoteData: typeof REMOTE_TEST_DATA_V24,
    changes: DataChange[],
    options?: { skipChanges?: number; skipAssertTimestamp?: boolean },
) {
    let now = 554
    const advance = () => {
        ++now
    }
    const skip = options?.skipChanges ?? 0
    const skipped: Array<ReturnType<jest.Expect['anything']>> = []
    for (let i = 0; i < skip; ++i) {
        advance()
        skipped.push(expect.anything())
    }

    return [
        ...skipped,
        ...changes.map((change) => {
            advance()

            return {
                id: expect.anything(),
                createdWhen: options?.skipAssertTimestamp
                    ? expect.anything()
                    : now,
                createdByDevice: remoteData.personalDeviceInfo.first.id,
                user: TEST_USER.id,
                type: change[0],
                collection: change[1],
                objectId: change[2],
                ...(change[3] ? { info: change[3] } : {}),
            }
        }),
    ]
}

function dataUsage(
    remoteData: typeof REMOTE_TEST_DATA_V24,
    changes: DataChange[],
    options?: {
        skipChanges?: number
        skippedUpdates?: number
        skipAssertTimestamp?: boolean
    },
) {
    let now = 554
    const advance = () => {
        ++now
    }
    const skip = (options?.skipChanges ?? 0) - (options?.skippedUpdates ?? 0)
    const usageEntries: any[] = []
    for (let i = 0; i < skip; ++i) {
        advance()
        usageEntries.push(expect.anything())
    }
    for (let i = 0; i < options?.skippedUpdates ?? 0; ++i) {
        advance()
    }

    for (const change of changes) {
        advance()

        if (change[0] === DataChangeType.Modify) {
            continue
        }

        usageEntries.push({
            id: expect.anything(),
            createdWhen: options?.skipAssertTimestamp ? expect.anything() : now,
            createdByDevice: remoteData.personalDeviceInfo.first.id,
            user: TEST_USER.id,
            action:
                change[0] === DataChangeType.Create
                    ? DataUsageAction.Create
                    : DataUsageAction.Delete,
            collection: change[1],
            objectId: change[2],
        })
    }

    return usageEntries
}

function dataChangesAndUsage(
    remoteData: typeof REMOTE_TEST_DATA_V24,
    changes: DataChange[],
    options?: {
        skipChanges?: number
        skippedUpdates?: number
        skipAssertTimestamp?: boolean
    },
) {
    return {
        // dataUsageEntry: dataUsage(remoteData, changes, options),
        personalDataChange: dataChanges(remoteData, changes, options),
    }
}

function blockStats(params: { usedBlocks: number }) {
    return {
        id: expect.anything(),
        usedBlocks: params.usedBlocks,
        lastChange: expect.any(Number),
        user: TEST_USER.id,
    }
}

async function setup(options?: { runReadwiseTrigger?: boolean }) {
    const serverIdCapturer = new IdCapturer({
        postprocesessMerge: (params) => {
            // tag connections don't connect with the content they tag through a
            // Storex relationship, so we need some extra logic to get the right ID
            for (const tagConnection of Object.values(
                params.merged.personalTagConnection,
            )) {
                const collectionIds =
                    serverIdCapturer.ids[tagConnection.collection]

                if (!collectionIds) {
                    continue
                }

                const idIndex = tagConnection.objectId - 1
                const id = collectionIds[idIndex]
                tagConnection.objectId = id
            }
        },
    })

    const fakeFetch = new FakeFetch()
    const storageHooksChangeWatcher = new StorageHooksChangeWatcher()

    const {
        setups,
        userId,
        serverStorage,
        getNow,
    } = await setupSyncBackgroundTest({
        deviceCount: 2,
        serverChangeWatchSettings: options?.runReadwiseTrigger
            ? storageHooksChangeWatcher
            : {
                  shouldWatchCollection: (collection) =>
                      collection.startsWith('personal'),
                  postprocessOperation: async (context) => {
                      await serverIdCapturer.handlePostStorageChange(context)
                  },
              },
    })

    serverIdCapturer.setup(serverStorage.storageManager)
    storageHooksChangeWatcher.setUp({
        fetch: fakeFetch.fetch,
        serverStorageManager: serverStorage.storageManager,
        getCurrentUserReference: async () => ({
            id: userId,
            type: 'user-reference',
        }),
        services: {
            activityStreams: setups[0].services.activityStreams,
        },
    })

    return {
        serverIdCapturer,
        setups,
        serverStorage,
        testDownload: async (
            expected: PersonalCloudUpdateBatch,
            downloadOptions?: {
                skip?: number
                deviceIndex?: number
                clientSchemaVersion?: Date
            },
        ) => {
            const clientSchemaVersion =
                downloadOptions?.clientSchemaVersion ??
                STORAGE_VERSIONS[26].version
            const { batch } = await downloadClientUpdates({
                getNow,
                startTime: 0,
                clientSchemaVersion,
                userId: TEST_USER.id,
                storageManager: serverStorage.storageManager,
                deviceId:
                    setups[downloadOptions?.deviceIndex ?? 1].backgroundModules
                        .personalCloud.deviceId,
                clientDeviceType: PersonalDeviceType.DesktopBrowser,
            })
            for (const update of batch) {
                if (update.type !== PersonalCloudUpdateType.Overwrite) {
                    continue
                }
                const storageManager =
                    update.storage === 'persistent'
                        ? setups[0].persistentStorageManager
                        : setups[0].storageManager
                preprocessPulledObject({
                    storageRegistry: storageManager.registry,
                    collection: update.collection,
                    object: update.object,
                })
            }
            expect(batch.slice(downloadOptions?.skip ?? 0)).toEqual(expected)
        },
        testFetches: (highlights: ReadwiseHighlight[]) =>
            expect(fakeFetch.capturedReqs).toEqual(
                highlights.map((highlight) => [
                    'https://readwise.io/api/v2/highlights/',
                    {
                        body: JSON.stringify({
                            highlights: [
                                {
                                    ...highlight,
                                    highlighted_at: highlight.highlighted_at.toISOString(),
                                },
                            ],
                        }),
                        method: 'POST',
                        headers: {
                            Authorization: 'Token test-key',
                            'Content-Type': 'application/json',
                        },
                    },
                ]),
            ),
    }
}

describe('Personal cloud translation layer', () => {
    describe(`from local schema version 26`, () => {
        it('should not download updates uploaded from the same device', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // prettier-ignore
            await testDownload([], { deviceIndex: 0 })
        })

        it('should create pages', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                ]),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
            ])
        })

        it('should update pages', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager.collection('pages').updateObjects(
                {
                    url: LOCAL_TEST_DATA_V24.pages.first.url,
                },
                { fullTitle: 'Updated title' },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [
                    {
                        ...testMetadata.first,
                        updatedWhen: 559,
                        title: 'Updated title',
                    },
                    testMetadata.second,
                ],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                {
                    type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: {
                        ...LOCAL_TEST_DATA_V24.pages.first,
                        fullTitle: 'Updated title'
                    }
                },
            ], { skip: 2 })
        })

        it('should delete pages', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager.collection('pages').deleteObjects({
                url: LOCAL_TEST_DATA_V24.pages.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.first.id, {
                        normalizedUrl: testLocators.first.location
                    }],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 1 })],
                personalContentMetadata: [testMetadata.second],
                personalContentLocator: [testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'pages', where: { url: LOCAL_TEST_DATA_V24.pages.first.url } },
            ], { skip: 1 })
        })

        it('should create locators', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()

            // Note we still want to insert the non-PDF pages here to test the different locators behavior
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.third)
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.third)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.fourth)
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.fourth_a)
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.fourth_b)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.third.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third_dummy.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.fourth.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_dummy.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_a.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_b.id],
                ]),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third, testMetadata.fourth],
                personalContentLocator: [testLocators.first, testLocators.second, testLocators.third_dummy, testLocators.third, testLocators.fourth_dummy, testLocators.fourth_a, testLocators.fourth_b],
            })

            // NOTE: Only the locators for the third+fourth pages are downloaded, as they are the only PDFs
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_b },
            ])
        })

        it('should delete locators', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()

            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.third)
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.third)
            await setups[0].storageManager
                .collection('locators')
                .deleteOneObject({
                    id: LOCAL_TEST_DATA_V24.locators.third.id,
                })
            await setups[0].storageManager.collection('pages').deleteOneObject({
                url: LOCAL_TEST_DATA_V24.pages.third.url,
            })

            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.third.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third_dummy.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third.id],
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.third.id, {
                        normalizedUrl: testLocators.third_dummy.location,
                    }],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.third_dummy.id],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.third.id, {
                        id: testLocators.third.localId,
                    }],

                ], { skipChanges: 0 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Delete, collection: 'pages', where: { url: LOCAL_TEST_DATA_V24.pages.third.url } },
                { type: PersonalCloudUpdateType.Delete, collection: 'locators', where: { id: LOCAL_TEST_DATA_V24.locators.third.id } },
            ])
        })

        it('should create bookmarks', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('bookmarks')
                .createObject(LOCAL_TEST_DATA_V24.bookmarks.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testBookmarks = remoteData.personalBookmark

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalBookmark',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalBookmark', testBookmarks.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalBookmark: [testBookmarks.first]
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'bookmarks', object: LOCAL_TEST_DATA_V24.bookmarks.first },
            ], { skip: 2 })
        })

        it('should delete bookmarks', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('bookmarks')
                .createObject(LOCAL_TEST_DATA_V24.bookmarks.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = { url: LOCAL_TEST_DATA_V24.bookmarks.first.url }
            await setups[0].storageManager
                .collection('bookmarks')
                .deleteOneObject(changeInfo)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testBookmarks = remoteData.personalBookmark

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalBookmark',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalBookmark', testBookmarks.first.id, changeInfo],
                ], { skipChanges: 5 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalBookmark: []
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'bookmarks', where: changeInfo },
            ], { skip: 2 })
        })

        it('should create visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('visits')
                .createObject(LOCAL_TEST_DATA_V24.visits.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testReads = remoteData.personalContentRead

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentRead', testReads.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [
                    { ...testLocators.first, lastVisited: LOCAL_TEST_DATA_V24.visits.first.time },
                    testLocators.second,
                ],
                personalContentRead: [testReads.first],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'visits', object: LOCAL_TEST_DATA_V24.visits.first },
            ], { skip: 2 })
        })

        it('should update visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            const updatedDuration =
                LOCAL_TEST_DATA_V24.visits.first.duration * 2

            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('visits')
                .createObject(LOCAL_TEST_DATA_V24.visits.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager.collection('visits').updateOneObject(
                {
                    url: LOCAL_TEST_DATA_V24.visits.first.url,
                    time: LOCAL_TEST_DATA_V24.visits.first.time,
                },
                { duration: updatedDuration },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testReads = remoteData.personalContentRead

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalContentRead', testReads.first.id],
                ], { skipChanges: 6, skippedUpdates: 1 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [
                    { ...testLocators.first, lastVisited: LOCAL_TEST_DATA_V24.visits.first.time },
                    testLocators.second,
                ],
                personalContentRead: [{
                    ...testReads.first,
                    updatedWhen: expect.any(Number),
                    readDuration: updatedDuration,
                }],
            })
            // prettier-ignore
            await testDownload([
                {
                    type: PersonalCloudUpdateType.Overwrite, collection: 'visits', object: {
                        ...LOCAL_TEST_DATA_V24.visits.first,
                        duration: updatedDuration,
                    }
                },
            ], { skip: 3 })
        })

        it('should delete visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()

            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('visits')
                .createObject(LOCAL_TEST_DATA_V24.visits.first)
            await setups[0].storageManager
                .collection('visits')
                .createObject(LOCAL_TEST_DATA_V24.visits.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('visits')
                .deleteObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testReads = remoteData.personalContentRead

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Delete, 'personalContentRead', testReads.first.id, {
                        url: LOCAL_TEST_DATA_V24.visits.first.url,
                        time: LOCAL_TEST_DATA_V24.visits.first.time,
                    }],
                    [DataChangeType.Modify, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Delete, 'personalContentRead', testReads.second.id, {
                        url: LOCAL_TEST_DATA_V24.visits.second.url,
                        time: LOCAL_TEST_DATA_V24.visits.second.time,
                    }],
                ], { skipChanges: 8, skippedUpdates: 2 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalContentRead: [],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Delete,
                        collection: 'visits',
                        where: {
                            url: LOCAL_TEST_DATA_V24.visits.first.url,
                            time: LOCAL_TEST_DATA_V24.visits.first.time,
                        },
                    },
                    {
                        type: PersonalCloudUpdateType.Delete,
                        collection: 'visits',
                        where: {
                            url: LOCAL_TEST_DATA_V24.visits.second.url,
                            time: LOCAL_TEST_DATA_V24.visits.second.time,
                        },
                    },
                ],
                { skip: 2 },
            )
        })

        it('should create annotations', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.second },
            ], { skip: 2 })
        })

        it('should update annotation notes', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            const updatedComment = 'This is an updated comment'
            const lastEdited = new Date()
            await setups[0].storageManager
                .collection('annotations')
                .updateOneObject(
                    { url: LOCAL_TEST_DATA_V24.annotations.first.url },
                    { comment: updatedComment, lastEdited },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotation', testAnnotations.first.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [{ ...testAnnotations.first, comment: updatedComment, updatedWhen: lastEdited.getTime() }],
                personalAnnotationSelector: [testSelectors.first],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'annotations',
                        object: {
                            ...LOCAL_TEST_DATA_V24.annotations.first,
                            comment: updatedComment,
                            lastEdited,
                        },
                    },
                ],
                { skip: 3 },
            )
        })

        it('should delete annotations', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotations')
                .deleteObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.first.id, { url: LOCAL_TEST_DATA_V24.annotations.first.url }],
                    [DataChangeType.Delete, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.second.id, { url: LOCAL_TEST_DATA_V24.annotations.second.url }],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [],
                personalAnnotationSelector: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'annotations', where: { url: LOCAL_TEST_DATA_V24.annotations.first.url } },
                { type: PersonalCloudUpdateType.Delete, collection: 'annotations', where: { url: LOCAL_TEST_DATA_V24.annotations.second.url } },
            ], { skip: 2 })
        })

        it('should create annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second,
                )
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first)
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(
                    LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testAnnotationShares = remoteData.personalAnnotationShare
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel',
                    'sharedAnnotation',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.second.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [testPrivacyLevels.first, testPrivacyLevels.second],
                sharedAnnotation: [
                    expect.objectContaining({
                        selector: JSON.stringify(LOCAL_TEST_DATA_V24.annotations.first.selector),
                        body: LOCAL_TEST_DATA_V24.annotations.first.body,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                    }),
                    expect.objectContaining({
                        comment: LOCAL_TEST_DATA_V24.annotations.second.comment,
                    }),
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second },
            ], { skip: 4 })
        })

        it('should update annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .updateOneObject(
                    {
                        id:
                            LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first
                                .id,
                    },
                    { privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testAnnotationShares = remoteData.personalAnnotationShare
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel',
                    'sharedAnnotation',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [{ ...testPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED }],
                sharedAnnotation: [
                    expect.objectContaining({
                        selector: JSON.stringify(LOCAL_TEST_DATA_V24.annotations.first.selector),
                        body: LOCAL_TEST_DATA_V24.annotations.first.body,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                    })
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED } },
            ], { skip: 3 })
        })

        it('should update annotation privacy levels, re-sharing on update to shared privacy level', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first)
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .updateOneObject(
                    {
                        id:
                            LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first
                                .id,
                    },
                    { privacyLevel: AnnotationPrivacyLevels.PRIVATE },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .updateOneObject(
                    {
                        id:
                            LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first
                                .id,
                    },
                    { privacyLevel: AnnotationPrivacyLevels.SHARED },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            setups[0].getServerStorage()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testAnnotationShares = remoteData.personalAnnotationShare
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationShare',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel',
                    'sharedAnnotation',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                ], { skipChanges: 8 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationShare: [testAnnotationShares.first],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [{ ...testPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED }],
                sharedAnnotation: [
                    expect.objectContaining({
                        selector: JSON.stringify(LOCAL_TEST_DATA_V24.annotations.first.selector),
                        body: LOCAL_TEST_DATA_V24.annotations.first.body,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                    })
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first, privacyLevel: AnnotationPrivacyLevels.SHARED } },
            ], { skip: 3 })
        })

        it('should delete annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first)
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(
                    LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                id: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second.id,
            }
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .deleteOneObject(changeInfo)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id, changeInfo],
                ], { skipChanges: 9 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [testPrivacyLevels.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'annotationPrivacyLevels', where: changeInfo },
            ], { skip: 5 })
        })

        it('should create custom lists', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalList: [testLists.first, testLists.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.second },
            ], { skip: 0 })
        })

        it('should update custom lists', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const updatedName = 'Updated list name'
            await setups[0].storageManager
                .collection('customLists')
                .updateOneObject(
                    { id: LOCAL_TEST_DATA_V24.customLists.first.id },
                    { name: updatedName, searchableName: updatedName },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalList', testLists.first.id],
                ], { skipChanges: 2 }),
                personalBlockStats: [],
                personalList: [{ ...testLists.first, name: updatedName }, testLists.second],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'customLists',
                        object: {
                            ...LOCAL_TEST_DATA_V24.customLists.first,
                            name: updatedName,
                            searchableName: updatedName,
                        },
                    },
                ],
                { skip: 2 },
            )
        })

        it('should delete custom lists', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            await setups[0].storageManager
                .collection('customLists')
                .deleteObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalList', testLists.first.id, { id: testLists.first.localId }],
                    [DataChangeType.Delete, 'personalList', testLists.second.id, { id: testLists.second.localId }],
                ], { skipChanges: 2 }),
                personalBlockStats: [],
                personalList: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'customLists', where: { id: LOCAL_TEST_DATA_V24.customLists.first.id } },
                { type: PersonalCloudUpdateType.Delete, collection: 'customLists', where: { id: LOCAL_TEST_DATA_V24.customLists.second.id } },
            ], { skip: 0 })
        })

        it('should create page list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testListEntries = remoteData.personalListEntry

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalListEntry', testListEntries.first.id],
                    [DataChangeType.Create, 'personalListEntry', testListEntries.second.id],
                ], { skipChanges: 5 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalListEntry: [testListEntries.first, testListEntries.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.second },
            ], { skip: 3 })
        })

        it('should delete page list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                listId: LOCAL_TEST_DATA_V24.pageListEntries.first.listId,
                pageUrl: LOCAL_TEST_DATA_V24.pageListEntries.first.pageUrl,
            }
            await setups[0].storageManager
                .collection('pageListEntries')
                .deleteOneObject(changeInfo)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testListEntries = remoteData.personalListEntry

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalListEntry', testListEntries.first.id, changeInfo],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalListEntry: [testListEntries.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'pageListEntries', where: changeInfo },
            ], { skip: 4 })
        })

        it('should create shared list metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListShares = remoteData.personalListShare
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalListShare', testListShares.first.id],
                ], { skipChanges: 1 }),
                personalBlockStats: [],
                personalListShare: [testListShares.first],
                personalList: [testLists.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
            ], { skip: 1 })
        })

        it('should delete shared list metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                localId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.localId,
            }
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .deleteOneObject(changeInfo)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListShares = remoteData.personalListShare
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalListShare', testListShares.first.id, changeInfo],
                ], { skipChanges: 2 }),
                personalBlockStats: [],
                personalList: [testLists.first],
                personalListShare: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'sharedListMetadata', where: changeInfo },
            ], { skip: 1 })
        })

        it('should create annotation list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotListEntries')
                .createObject(LOCAL_TEST_DATA_V24.annotationListEntries.first)

            await setups[0].backgroundModules.personalCloud.waitForSync()
            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testAnnotationListEntries =
                remoteData.personalAnnotationListEntry

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalAnnotationListEntry',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationListEntry', testAnnotationListEntries.first.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalAnnotationListEntry: [testAnnotationListEntries.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotListEntries', object: LOCAL_TEST_DATA_V24.annotationListEntries.first },
            ], { skip: 4 })
        })

        it('should delete annotation list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotListEntries')
                .createObject(LOCAL_TEST_DATA_V24.annotationListEntries.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                listId: LOCAL_TEST_DATA_V24.annotationListEntries.first.listId,
                url: LOCAL_TEST_DATA_V24.annotationListEntries.first.url,
            }
            await setups[0].storageManager
                .collection('annotListEntries')
                .deleteOneObject(changeInfo)

            await setups[0].backgroundModules.personalCloud.waitForSync()
            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testAnnotationListEntries =
                remoteData.personalAnnotationListEntry

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalAnnotationListEntry',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationListEntry', testAnnotationListEntries.first.id, changeInfo],
                ], { skipChanges: 8 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalAnnotationListEntry: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'annotListEntries', where: changeInfo },
            ], { skip: 4 })
        })

        it('should create shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector
            const testAnnotationShares = remoteData.personalAnnotationShare

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.second.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationShare: [testAnnotationShares.first, testAnnotationShares.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second },
            ], { skip: 4 })
        })

        it('should update shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                excludeFromLists: !LOCAL_TEST_DATA_V24.sharedAnnotationMetadata
                    .second.excludeFromLists,
            }
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .updateOneObject(
                    {
                        localId:
                            LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second
                                .localId,
                    },
                    changeInfo,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector
            const testAnnotationShares = remoteData.personalAnnotationShare

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationShare', testAnnotationShares.second.id],

                ], { skipChanges: 9 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationShare: [testAnnotationShares.first, { ...testAnnotationShares.second, ...changeInfo }],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'sharedAnnotationMetadata',
                        object: {
                            ...LOCAL_TEST_DATA_V24.sharedAnnotationMetadata
                                .second,
                            ...changeInfo,
                        },
                    },
                ],
                { skip: 6 },
            )
        })

        it('should delete shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const changeInfo = {
                localId:
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second.localId,
            }
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .deleteOneObject(changeInfo)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector
            const testAnnotationShares = remoteData.personalAnnotationShare

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationShare', testAnnotationShares.second.id, changeInfo],
                ], { skipChanges: 9 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationShare: [testAnnotationShares.first]
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'sharedAnnotationMetadata', where: changeInfo },
            ], { skip: 5 })
        })

        it('should create page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'annotation',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.firstPageTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstPageTag.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [testTags.firstPageTag],
                personalTagConnection: [testConnections.firstPageTag],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'tags', object: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 2 })
        })

        it('should connect existing page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.secondPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'annotation',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstPageTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.secondPageTag.id],
                ], { skipChanges: 5 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [testTags.firstPageTag],
                personalTagConnection: [testConnections.firstPageTag, testConnections.secondPageTag],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: LOCAL_TEST_DATA_V24.tags.firstPageTag,
                    },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: LOCAL_TEST_DATA_V24.tags.secondPageTag,
                    },
                ],
                { skip: 2 },
            )
        })

        it('should remove page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.secondPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'annotation',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstPageTag.id, LOCAL_TEST_DATA_V24.tags.firstPageTag],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [testConnections.secondPageTag],
                personalTag: [testTags.firstPageTag],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 3 })
        })

        it('final tag removal for page should remove now-orphaned personalTag', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.firstPageTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'annotation',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstPageTag.id, LOCAL_TEST_DATA_V24.tags.firstPageTag],
                    [DataChangeType.Delete, 'personalTag', testTags.firstPageTag.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [blockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [],
                personalTag: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 2 })
        })

        it('should add annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'page',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [testConnections.firstAnnotationTag],
                personalTag: [testTags.firstAnnotationTag],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'tags',
                    object: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag
                },
            ], { skip: 2 })
        })

        it('should connect existing annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.secondAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'page',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.secondAnnotationTag.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [testConnections.firstAnnotationTag, testConnections.secondAnnotationTag],
                personalTag: [testTags.firstAnnotationTag],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag,
                    },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: LOCAL_TEST_DATA_V24.tags.secondAnnotationTag,
                    },
                ],
                { skip: 4 },
            )
        })

        it('should remove annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.secondAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'page',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstAnnotationTag.id, LOCAL_TEST_DATA_V24.tags.firstAnnotationTag],
                ], { skipChanges: 10 }),
                personalBlockStats: [blockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [testConnections.secondAnnotationTag],
                personalTag: [testTags.firstAnnotationTag],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag },
            ], { skip: 5 })
        })

        it('final tag removal for annotation should remove now-orphaned personalTag', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                skipTagType: 'page',
            })
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstAnnotationTag.id, LOCAL_TEST_DATA_V24.tags.firstAnnotationTag],
                    [DataChangeType.Delete, 'personalTag', testTags.firstAnnotationTag.id],
                ], { skipChanges: 8 }),
                personalBlockStats: [blockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [],
                personalTag: [],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag },
            ], { skip: 3 })
        })

        it('should create text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.first)
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testTemplates = remoteData.personalTextTemplate

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalTextTemplate', testTemplates.first.id],
                    [DataChangeType.Create, 'personalTextTemplate', testTemplates.second.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalTextTemplate: [testTemplates.first, testTemplates.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'templates', object: LOCAL_TEST_DATA_V24.templates.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'templates', object: LOCAL_TEST_DATA_V24.templates.second },
            ], { skip: 0 })
        })

        it('should update text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.first)
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const updatedCode = '#{{{PageUrl}}}'
            const updatedTitle = 'New title'
            await setups[0].storageManager
                .collection('templates')
                .updateOneObject(
                    { id: LOCAL_TEST_DATA_V24.templates.first.id },
                    { code: updatedCode },
                )
            await setups[0].storageManager
                .collection('templates')
                .updateOneObject(
                    { id: LOCAL_TEST_DATA_V24.templates.second.id },
                    { title: updatedTitle },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testTemplates = remoteData.personalTextTemplate

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Modify, 'personalTextTemplate', testTemplates.first.id],
                    [DataChangeType.Modify, 'personalTextTemplate', testTemplates.second.id],
                ], { skipChanges: 2 }),
                personalBlockStats: [],
                personalTextTemplate: [{
                    ...testTemplates.first,
                    code: updatedCode,
                }, {
                    ...testTemplates.second,
                    title: updatedTitle,
                }],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'templates',
                        object: {
                            ...LOCAL_TEST_DATA_V24.templates.first,
                            code: updatedCode,
                        },
                    },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'templates',
                        object: {
                            ...LOCAL_TEST_DATA_V24.templates.second,
                            title: updatedTitle,
                        },
                    },
                ],
                { skip: 2 },
            )
        })

        it('should delete text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.first)
            await setups[0].storageManager
                .collection('templates')
                .createObject(LOCAL_TEST_DATA_V24.templates.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('templates')
                .deleteObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testTemplates = remoteData.personalTextTemplate

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Delete, 'personalTextTemplate', testTemplates.first.id, { id: LOCAL_TEST_DATA_V24.templates.first.id }],
                    [DataChangeType.Delete, 'personalTextTemplate', testTemplates.second.id, { id: LOCAL_TEST_DATA_V24.templates.second.id }],
                ], { skipChanges: 2 }),
                personalBlockStats: [],
                personalTextTemplate: [],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'templates', where: { id: LOCAL_TEST_DATA_V24.templates.first.id } },
                { type: PersonalCloudUpdateType.Delete, collection: 'templates', where: { id: LOCAL_TEST_DATA_V24.templates.second.id } },
            ], { skip: 0 })
        })

        it('should create Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.first)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.second)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.third)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testSettings = remoteData.personalMemexSetting

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.first.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.second.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.third.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalMemexSetting: [testSettings.first, testSettings.second, testSettings.third],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.third },
            ], { skip: 0 })
        })

        it('should update Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.first)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.second)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.third)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            const updatedValue = 'new-value'
            await setups[0].storageManager
                .collection('settings')
                .updateOneObject(
                    { key: LOCAL_TEST_DATA_V24.settings.first.key },
                    {
                        value: updatedValue,
                    },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testSettings = remoteData.personalMemexSetting

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.first.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.second.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.third.id],
                    [DataChangeType.Modify, 'personalMemexSetting', testSettings.first.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalMemexSetting: [{ ...testSettings.first, value: updatedValue }, testSettings.second, testSettings.third],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: { ...LOCAL_TEST_DATA_V24.settings.first, value: updatedValue } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: { ...LOCAL_TEST_DATA_V24.settings.first, value: updatedValue } },
            ], { skip: 0 })
        })

        it('should delete Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.first)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.second)
            await setups[0].storageManager
                .collection('settings')
                .createObject(LOCAL_TEST_DATA_V24.settings.third)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('settings')
                .deleteOneObject({
                    key: LOCAL_TEST_DATA_V24.settings.first.key,
                })
            await setups[0].storageManager
                .collection('settings')
                .deleteOneObject({
                    key: LOCAL_TEST_DATA_V24.settings.second.key,
                })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testSettings = remoteData.personalMemexSetting

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...dataChangesAndUsage(remoteData, [
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.first.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.second.id],
                    [DataChangeType.Create, 'personalMemexSetting', testSettings.third.id],
                    [DataChangeType.Delete, 'personalMemexSetting', testSettings.first.id, { key: testSettings.first.name }],
                    [DataChangeType.Delete, 'personalMemexSetting', testSettings.second.id, { key: testSettings.second.name }],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalMemexSetting: [testSettings.third],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'settings', object: LOCAL_TEST_DATA_V24.settings.third },
                { type: PersonalCloudUpdateType.Delete, collection: 'settings', where: { key: LOCAL_TEST_DATA_V24.settings.first.key } },
                { type: PersonalCloudUpdateType.Delete, collection: 'settings', where: { key: LOCAL_TEST_DATA_V24.settings.second.key } },
            ], { skip: 0 })
        })

        describe(`translation layer readwise integration`, () => {
            it('should create annotations, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                        [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                    ], { skipChanges: 4, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [testAnnotations.first, testAnnotations.second],
                    personalAnnotationSelector: [testSelectors.first],
                    personalReadwiseAction: [testReadwiseActions.first, testReadwiseActions.second],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.second },
                ], { skip: 2 })
            })

            it('should update annotation notes, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                const updatedComment = 'This is an updated comment'
                const lastEdited = new Date()
                await setups[0].storageManager
                    .collection('annotations')
                    .updateOneObject(
                        { url: LOCAL_TEST_DATA_V24.annotations.first.url },
                        { comment: updatedComment, lastEdited },
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Modify, 'personalAnnotation', testAnnotations.first.id],
                    ], { skipChanges: 6, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [{ ...testAnnotations.first, comment: updatedComment, updatedWhen: lastEdited.getTime() }],
                    personalAnnotationSelector: [testSelectors.first],
                    personalReadwiseAction: [testReadwiseActions.first],
                })

                await testDownload(
                    [
                        {
                            type: PersonalCloudUpdateType.Overwrite,
                            collection: 'annotations',
                            object: {
                                ...LOCAL_TEST_DATA_V24.annotations.first,
                                comment: updatedComment,
                                lastEdited,
                            },
                        },
                    ],
                    { skip: 3 },
                )
            })

            it('should add annotation tags, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                    {
                        skipTagType: 'page',
                    },
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTags = remoteData.personalTag
                const testConnections = remoteData.personalTagConnection
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalTag',
                        'personalTagConnection',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                        [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                        [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                        [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                    ], { skipChanges: 4, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [testAnnotations.first],
                    personalAnnotationSelector: [testSelectors.first],
                    personalTagConnection: [testConnections.firstAnnotationTag],
                    personalTag: [testTags.firstAnnotationTag],
                    personalReadwiseAction: [testReadwiseActions.first],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag
                    },
                ], { skip: 2 })
            })

            it('should remove annotation tags, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.secondAnnotationTag)
                await setups[0].backgroundModules.personalCloud.waitForSync()
                await setups[0].storageManager
                    .collection('tags')
                    .deleteOneObject(
                        LOCAL_TEST_DATA_V24.tags.firstAnnotationTag,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                    {
                        skipTagType: 'page',
                    },
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTags = remoteData.personalTag
                const testConnections = remoteData.personalTagConnection
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalTag',
                        'personalTagConnection',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                        [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                        [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                        [DataChangeType.Create, 'personalTagConnection', testConnections.secondAnnotationTag.id],
                        [DataChangeType.Delete, 'personalTagConnection', testConnections.firstAnnotationTag.id, LOCAL_TEST_DATA_V24.tags.firstAnnotationTag],
                    ], { skipChanges: 6, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [testAnnotations.first, testAnnotations.second],
                    personalAnnotationSelector: [testSelectors.first],
                    personalTagConnection: [testConnections.secondAnnotationTag],
                    personalTag: [testTags.firstAnnotationTag],
                    personalReadwiseAction: [testReadwiseActions.first, testReadwiseActions.second],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag },
                ], { skip: 5 })
            })

            it('should add annotation spaces, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testAnnotListEntries =
                    remoteData.personalAnnotationListEntry
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalList',
                        'personalAnnotationListEntry',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                        [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                        [DataChangeType.Create, 'personalList', testLists.first.id],
                        [DataChangeType.Create, 'personalAnnotationListEntry', testAnnotListEntries.first.id],
                    ], { skipChanges: 4, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [testAnnotations.first],
                    personalAnnotationSelector: [testSelectors.first],
                    personalAnnotationListEntry: [testAnnotListEntries.first],
                    personalList: [testLists.first],
                    personalReadwiseAction: [testReadwiseActions.first],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'customLists',
                        object: LOCAL_TEST_DATA_V24.customLists.first
                    },
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'annotListEntries',
                        object: LOCAL_TEST_DATA_V24.annotationListEntries.first
                    },
                ], { skip: 2 })
            })

            it('should remove annotation spaces, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.second,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .deleteOneObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testAnnotListEntries =
                    remoteData.personalAnnotationListEntry
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const testReadwiseActions = remoteData.personalReadwiseAction

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalList',
                        'personalAnnotationListEntry',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...dataChangesAndUsage(remoteData, [
                        [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                        [DataChangeType.Create, 'personalList', testLists.first.id],
                        [DataChangeType.Create, 'personalAnnotationListEntry', testAnnotListEntries.first.id],
                        [DataChangeType.Create, 'personalAnnotationListEntry', testAnnotListEntries.second.id],
                        [DataChangeType.Delete, 'personalAnnotationListEntry', testAnnotListEntries.first.id, {
                            url: LOCAL_TEST_DATA_V24.annotationListEntries.first.url,
                            listId: LOCAL_TEST_DATA_V24.annotationListEntries.first.listId,
                        }],
                    ], { skipChanges: 6, skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalAnnotation: [testAnnotations.first, testAnnotations.second],
                    personalAnnotationSelector: [testSelectors.first],
                    personalAnnotationListEntry: [testAnnotListEntries.second],
                    personalList: [testLists.first],
                    personalReadwiseAction: [testReadwiseActions.first, testReadwiseActions.second],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Delete, collection: 'annotListEntries', where: {
                        url: LOCAL_TEST_DATA_V24.annotationListEntries.first.url,
                        listId: LOCAL_TEST_DATA_V24.annotationListEntries.first.listId,
                    } },
                ], { skip: 6 })
            })

            it('should create annotations, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const firstHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })
                const secondHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.second,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })

                testFetches([firstHighlight, secondHighlight])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should update annotation notes, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                const updatedComment = 'This is an updated comment'
                const lastEdited = new Date()
                await setups[0].storageManager
                    .collection('annotations')
                    .updateOneObject(
                        { url: LOCAL_TEST_DATA_V24.annotations.first.url },
                        { comment: updatedComment, lastEdited },
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const highlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })

                testFetches([highlight, { ...highlight, note: updatedComment }])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation tags, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTags = remoteData.personalTag
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const highlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })
                const highlightWithTags = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [testTags.firstAnnotationTag],
                    lists: [],
                })

                testFetches([highlight, highlightWithTags])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should remove annotation tags, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.firstAnnotationTag)
                await setups[0].storageManager
                    .collection('tags')
                    .createObject(LOCAL_TEST_DATA_V24.tags.secondAnnotationTag)
                await setups[0].backgroundModules.personalCloud.waitForSync()
                await setups[0].storageManager
                    .collection('tags')
                    .deleteOneObject(
                        LOCAL_TEST_DATA_V24.tags.firstAnnotationTag,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTags = remoteData.personalTag
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const firstHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [],
                })
                const firstHighlightWithTags = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [testTags.firstAnnotationTag],
                    lists: [],
                })
                const secondHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.second,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [],
                })
                const secondHighlightWithTags = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.second,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [testTags.secondAnnotationTag],
                    lists: [],
                })

                testFetches([
                    firstHighlight,
                    secondHighlight,
                    firstHighlightWithTags,
                    secondHighlightWithTags,
                    firstHighlight,
                ])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation spaces, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const highlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })
                const highlightWithLists = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [testLists.first],
                })

                testFetches([highlight, highlightWithLists])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should remove annotation spaces, triggering readwise highlight upload', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.second)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.second,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .deleteOneObject(
                        LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector
                const firstHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [],
                })
                const firstHighlightWithLists = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [testLists.first],
                })
                const secondHighlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.second,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [],
                })
                const secondHighlightWithLists = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.second,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    tags: [],
                    lists: [testLists.first],
                })

                testFetches([
                    firstHighlight,
                    secondHighlight,
                    firstHighlightWithLists,
                    secondHighlightWithLists,
                    firstHighlight,
                ])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should trigger readwise highlight re-uploads upon annotation tags and spaces adds, substituting hyphens for spaces', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                const testTagWithSpaces = 'test tag spaces'
                const testListWithSpaces = 'test list spaces'
                const testTagWithHypens = formatReadwiseHighlightTag(
                    testTagWithSpaces,
                )
                const testListWithHypens = formatReadwiseHighlightTag(
                    testListWithSpaces,
                )
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager.collection('tags').createObject({
                    url: LOCAL_TEST_DATA_V24.annotations.first.url,
                    name: testTagWithSpaces,
                })
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject({
                        id: 20220509,
                        name: testListWithSpaces,
                        createdAt: new Date(),
                    })
                await setups[0].storageManager
                    .collection('annotListEntries')
                    .createObject({
                        listId: 20220509,
                        createdAt: new Date(),
                        url: LOCAL_TEST_DATA_V24.annotations.first.url,
                    })
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const highlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [],
                })
                const highlightWithTags = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: testMetadata.first,
                    lists: [],
                    tags: [{ name: testTagWithSpaces }],
                })
                const highlightWithTagsAndSpaces = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [{ name: testListWithSpaces }],
                        tags: [{ name: testTagWithSpaces }],
                    },
                )

                testFetches([
                    highlight,
                    highlightWithTags,
                    highlightWithTagsAndSpaces,
                ])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation to page without title, triggering readwise highlight upload, substituting URL for title', async () => {
                const { setups, serverStorage, testFetches } = await setup({
                    runReadwiseTrigger: true,
                })
                await insertReadwiseAPIKey(
                    serverStorage.storageManager,
                    TEST_USER.id,
                )
                const {
                    fullTitle,
                    ...titlelessPage
                } = LOCAL_TEST_DATA_V24.pages.first

                await setups[0].storageManager
                    .collection('pages')
                    .createObject(titlelessPage)
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = REMOTE_TEST_DATA_V24
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testAnnotations = remoteData.personalAnnotation
                const testSelectors = remoteData.personalAnnotationSelector

                const { title, ...titlelessMetadata } = testMetadata.first
                const highlight = cloudDataToReadwiseHighlight({
                    annotation: testAnnotations.first,
                    selector: testSelectors.first,
                    locator: testLocators.first as any,
                    metadata: titlelessMetadata,
                    tags: [],
                    lists: [],
                })

                testFetches([highlight])
                expect(
                    await serverStorage.storageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })
        })

        describe('specific scenarios (may have regressed in past)', () => {
            it('should create a list, PDF page, add that page to a list, then create a shared annotation', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                // Create + share list
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.third)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.third)
                // Add page to list
                await setups[0].storageManager
                    .collection('pageListEntries')
                    .createObject(LOCAL_TEST_DATA_V24.pageListEntries.third)
                // Create shared annotation
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.third)
                await setups[0].storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject(
                        LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.third,
                    )
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationPrivacyLevels.third,
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testListEntries = remoteData.personalListEntry
                const testListShares = remoteData.personalListShare
                const testAnnotations = remoteData.personalAnnotation
                const testAnnotationShares = remoteData.personalAnnotationShare
                const testPrivacyLevels =
                    remoteData.personalAnnotationPrivacyLevel

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        'personalBlockStats',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalList',
                        'personalListEntry',
                        'personalListShare',
                        'personalAnnotation',
                        'personalAnnotationShare',
                        'personalAnnotationPrivacyLevel',
                        'sharedList',
                        'sharedAnnotation',
                        'sharedAnnotationListEntry',
                        'sharedContentFingerprint',
                        'sharedContentLocator',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    personalBlockStats: [blockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.third_dummy, testLocators.third],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.third],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.third],
                    personalAnnotationShare: [testAnnotationShares.third],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.third],
                    sharedList: [
                        expect.objectContaining({
                            title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        }),
                    ],
                    sharedAnnotation: [
                        expect.objectContaining({
                            comment: LOCAL_TEST_DATA_V24.annotations.third.comment,
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                        }),
                    ],
                    sharedAnnotationListEntry: [
                        expect.objectContaining({
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                        }),
                    ],
                    sharedContentFingerprint: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            fingerprint: testLocators.third.fingerprint,
                        }),
                    ],
                    sharedContentLocator: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            originalUrl: testLocators.third.originalLocation,
                        }),
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.third },
                ], { skip: 2 })
            })

            it('should index a remote PDF page, create a shared annotation, create and share a new list, then add that page to the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.third)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.third)
                // Create shared annotation
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.third)
                await setups[0].storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject(
                        LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.third,
                    )
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationPrivacyLevels.third,
                    )
                // Create + share list
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                // Add page to list
                await setups[0].storageManager
                    .collection('pageListEntries')
                    .createObject(LOCAL_TEST_DATA_V24.pageListEntries.third)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testListEntries = remoteData.personalListEntry
                const testListShares = remoteData.personalListShare
                const testAnnotations = remoteData.personalAnnotation
                const testAnnotationShares = remoteData.personalAnnotationShare
                const testPrivacyLevels =
                    remoteData.personalAnnotationPrivacyLevel

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        'personalBlockStats',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalList',
                        'personalListEntry',
                        'personalListShare',
                        'personalAnnotation',
                        'personalAnnotationShare',
                        'personalAnnotationPrivacyLevel',
                        'sharedList',
                        'sharedAnnotation',
                        'sharedAnnotationListEntry',
                        'sharedContentFingerprint',
                        'sharedContentLocator',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    personalBlockStats: [blockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.third_dummy, testLocators.third],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.third],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.third],
                    personalAnnotationShare: [testAnnotationShares.third],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.third],
                    sharedList: [
                        expect.objectContaining({
                            title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        }),
                    ],
                    sharedAnnotation: [
                        expect.objectContaining({
                            comment: LOCAL_TEST_DATA_V24.annotations.third.comment,
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                        }),
                    ],
                    sharedAnnotationListEntry: [
                        expect.objectContaining({
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                        }),
                    ],
                    sharedContentFingerprint: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            fingerprint: testLocators.third.fingerprint,
                        }),
                    ],
                    sharedContentLocator: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            originalUrl: testLocators.third.originalLocation,
                        }),
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.third },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.third },
                ], { skip: 2 })
            })

            it('should index a local PDF page, create a shared annotation, create and share a new list, then add that page to the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.fourth)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_a)
                // Create shared annotation
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.fifth)
                await setups[0].storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject(
                        LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth,
                    )
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth,
                    )
                // Create + share list
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                // Add page to list
                await setups[0].storageManager
                    .collection('pageListEntries')
                    .createObject(LOCAL_TEST_DATA_V24.pageListEntries.fourth)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                    { anyId: true },
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testListEntries = remoteData.personalListEntry
                const testListShares = remoteData.personalListShare
                const testAnnotations = remoteData.personalAnnotation
                const testAnnotationShares = remoteData.personalAnnotationShare
                const testPrivacyLevels =
                    remoteData.personalAnnotationPrivacyLevel

                testLocators.fourth_dummy.personalContentMetadata =
                    testMetadata.fourth.id
                testLocators.fourth_a.personalContentMetadata =
                    testMetadata.fourth.id

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        'personalBlockStats',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalList',
                        'personalListEntry',
                        'personalListShare',
                        'personalAnnotation',
                        'personalAnnotationShare',
                        'personalAnnotationPrivacyLevel',
                        'sharedList',
                        'sharedAnnotation',
                        'sharedAnnotationListEntry',
                        'sharedContentFingerprint',
                        'sharedContentLocator',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    personalBlockStats: [blockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.fourth],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.fourth_dummy, testLocators.fourth_a],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.third],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.fifth],
                    personalAnnotationShare: [testAnnotationShares.fifth],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.fifth],
                    sharedList: [
                        expect.objectContaining({
                            title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        }),
                    ],
                    sharedAnnotation: [
                        expect.objectContaining({
                            comment: LOCAL_TEST_DATA_V24.annotations.fifth.comment,
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        }),
                    ],
                    sharedAnnotationListEntry: [
                        expect.objectContaining({
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        }),
                    ],
                    sharedContentFingerprint: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                        }),
                    ],
                    sharedContentLocator: [
                        // NOTE: This shouldn't get shared as it's a local filesystem locator
                        // expect.objectContaining({
                        //     normalizedUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        //     originalUrl: testLocators.fourth_a.originalLocation,
                        // }),
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.fourth },
                ], { skip: 2 })
            })

            it('should index a PDF page, create a shared annotation, create a new list, add that page to the list, then share the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.fourth)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_a)
                // Create shared annotation
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.fifth)
                await setups[0].storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject(
                        LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth,
                    )
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth,
                    )
                // Create list
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                // Add page to list
                await setups[0].storageManager
                    .collection('pageListEntries')
                    .createObject(LOCAL_TEST_DATA_V24.pageListEntries.fourth)
                // Share list
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                    { anyId: true },
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testListEntries = remoteData.personalListEntry
                const testListShares = remoteData.personalListShare
                const testAnnotations = remoteData.personalAnnotation
                const testAnnotationShares = remoteData.personalAnnotationShare
                const testPrivacyLevels =
                    remoteData.personalAnnotationPrivacyLevel

                testLocators.fourth_dummy.personalContentMetadata =
                    testMetadata.fourth.id
                testLocators.fourth_a.personalContentMetadata =
                    testMetadata.fourth.id

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        'personalBlockStats',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalList',
                        'personalListEntry',
                        'personalListShare',
                        'personalAnnotation',
                        'personalAnnotationShare',
                        'personalAnnotationPrivacyLevel',
                        'sharedList',
                        'sharedAnnotation',
                        'sharedAnnotationListEntry',
                        'sharedContentFingerprint',
                        'sharedContentLocator',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    personalBlockStats: [blockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.fourth],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.fourth_dummy, testLocators.fourth_a],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.third],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.fifth],
                    personalAnnotationShare: [testAnnotationShares.fifth],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.fifth],
                    sharedList: [
                        expect.objectContaining({
                            title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        }),
                    ],
                    sharedAnnotation: [
                        expect.objectContaining({
                            comment: LOCAL_TEST_DATA_V24.annotations.fifth.comment,
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        }),
                    ],
                    sharedAnnotationListEntry: [
                        expect.objectContaining({
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        }),
                    ],
                    sharedContentFingerprint: [
                        expect.objectContaining({
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                        }),
                    ],
                    sharedContentLocator: [
                        // NOTE: This shouldn't get shared as it's a local filesystem locator
                        // expect.objectContaining({
                        //     normalizedUrl: LOCAL_TEST_DATA_V24.annotations.fifth.pageUrl,
                        //     originalUrl: testLocators.fourth_a.originalLocation,
                        // }),
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                ], { skip: 2 })
            })

            it('should index a page, create a shared list, create a private annotation, add page to list, then share the annotation', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorage,
                    testDownload,
                } = await setup()
                await insertTestPages(setups[0].storageManager)
                // Create + share list
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                // Create private annotation
                await setups[0].storageManager
                    .collection('annotations')
                    .createObject(LOCAL_TEST_DATA_V24.annotations.first)
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject(
                        LOCAL_TEST_DATA_V24.annotationPrivacyLevels
                            .first_private,
                    )
                // Add page to list
                await setups[0].storageManager
                    .collection('pageListEntries')
                    .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
                // Share annotation
                await setups[0].storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject(
                        LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                    )
                await setups[0].storageManager
                    .collection('annotationPrivacyLevels')
                    .updateOneObject(
                        {
                            id:
                                LOCAL_TEST_DATA_V24.annotationPrivacyLevels
                                    .first_private.id,
                        },
                        {
                            privacyLevel: AnnotationPrivacyLevels.SHARED,
                        },
                    )
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                    { anyId: true },
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testLists = remoteData.personalList
                const testListEntries = remoteData.personalListEntry
                const testListShares = remoteData.personalListShare
                const testAnnotations = remoteData.personalAnnotation
                const testAnnotationShares = remoteData.personalAnnotationShare
                const testPrivacyLevels =
                    remoteData.personalAnnotationPrivacyLevel

                // prettier-ignore
                expect(
                    await getDatabaseContents(serverStorage.storageManager, [
                        'personalBlockStats',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalList',
                        'personalListEntry',
                        'personalListShare',
                        'personalAnnotation',
                        'personalAnnotationShare',
                        'personalAnnotationPrivacyLevel',
                        'sharedList',
                        'sharedAnnotation',
                        'sharedAnnotationListEntry',
                        'sharedContentFingerprint',
                        'sharedContentLocator',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    personalBlockStats: [blockStats({ usedBlocks: 3 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second],
                    personalContentLocator: [testLocators.first, testLocators.second],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.first],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.first],
                    personalAnnotationShare: [testAnnotationShares.first],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.first],
                    sharedList: [
                        expect.objectContaining({
                            title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        }),
                    ],
                    sharedAnnotation: [
                        expect.objectContaining({
                            comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                        }),
                    ],
                    sharedAnnotationListEntry: [
                        expect.objectContaining({
                            normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                        }),
                    ],
                    sharedContentFingerprint: [],
                    sharedContentLocator: [],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first },
                ], { skip: 0 })
            })
        })
    })
})
