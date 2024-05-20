import StorageManager, {
    isChildOfRelationship,
    getChildOfRelationshipTarget,
    FindManyOptions,
} from '@worldbrain/storex'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { setupSyncBackgroundTest } from '../../index.tests'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
    REMOTE_METADATA_V24_AMENDED,
    insertTestPages,
    insertReadwiseAPIKey,
} from './index.test.data'
import {
    DataChangeType,
    FingerprintSchemeType,
    LocationSchemeType,
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
import {
    initSqlUsage,
    InitSqlUsageParams,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/utils'
import type { MockPushMessagingService } from 'src/tests/push-messaging'
import {
    SharedListRoleID,
    SharedListTree,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { ChangeWatchMiddlewareSettings } from '@worldbrain/storex-middleware-change-watcher/lib/index'
import {
    buildMaterializedPath,
    extractMaterializedPathIds,
} from 'src/content-sharing/utils'
import cloneDeep from 'lodash/cloneDeep'
import omit from 'lodash/omit'
import { ROOT_NODE_PARENT_ID } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import type { ListTree } from 'src/custom-lists/background/types'
import delay from 'src/util/delay'
import { mergeTermFields } from '@worldbrain/memex-common/lib/page-indexing/utils'
import type { PipelineRes } from 'src/search'
import { extractTerms } from '@worldbrain/memex-common/lib/page-indexing/pipeline'
import type { ExceptionCapturer } from '@worldbrain/memex-common/lib/firebase-backend/types'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { SHARED_LIST_TIMESTAMP_SET_ROUTE } from '@worldbrain/memex-common/lib/page-activity-indicator/backend/constants'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

const isFBEmu = process.env.TEST_SERVER_STORAGE === 'firebase-emulator'

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
        opts?: {
            skipTagType?: 'annotation' | 'page'
            userOverride?: AutoPk
            deviceOverride?: AutoPk
            anyId?: boolean
        },
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
                    user: opts?.userOverride ?? object['user'],
                    createdByDevice:
                        opts?.deviceOverride ?? object['createdByDevice'],
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
                        const targetId = opts?.anyId
                            ? expect.anything()
                            : this.ids[targetCollection]?.[index]
                        mergedObject[relationship.alias] =
                            targetId ?? mergedObject[relationship.alias]
                    }
                }
                if (
                    collectionDefinition.name === 'personalListTree' &&
                    mergedObject['path'] != null
                ) {
                    const pathIds = extractMaterializedPathIds(
                        mergedObject.path,
                        'number',
                    ) as number[]
                    const fixedPathIds = pathIds
                        .map((id) => this.ids['personalList']?.[id - 1] ?? null)
                        .filter((id) => id != null)
                    mergedObject.path = buildMaterializedPath(...fixedPathIds)
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

async function getCrossDatabaseContents(
    storageManager: StorageManager,
    getSqlStorageMananager: () => Promise<StorageManager>,
    collections: string[],
    options?: { getWhere?(collection: string): any },
) {
    const contents: { [collection: string]: any[] } = {}
    await Promise.all(
        collections.map(async (collection) => {
            const manager =
                (collection.startsWith('personal') &&
                    (await getSqlStorageMananager?.())) ||
                storageManager

            const collDef = manager.registry.collections[collection]
            const order: FindManyOptions = collDef?.fields['createdWhen']
                ? {
                      order: [['createdWhen', 'asc']],
                  }
                : undefined

            contents[collection] = (
                await manager
                    .collection(collection)
                    .findObjects(options?.getWhere?.(collection) ?? {}, order)
            ).map(deleteNullFields)
        }),
    )
    return contents
}

type DataChange = [
    /* type: */ DataChangeType,
    /* collection: */ string,
    /* id: */ string | number,
    /* info? */ any?,
    /* overrides? */ any?,
]

interface DataChangeAssertOpts {
    skipChanges?: number
    skipAssertTimestamp?: boolean
    skipAssertDeviceId?: boolean
}

function dataChanges(
    remoteData: typeof REMOTE_TEST_DATA_V24,
    userId: number | string,
    changes: DataChange[],
    options?: DataChangeAssertOpts,
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
                createdByDevice: options?.skipAssertDeviceId
                    ? undefined
                    : remoteData.personalDeviceInfo.first.id,
                user: userId,
                type: change[0],
                collection: change[1],
                objectId: change[2],
                ...(change[3] ? { info: change[3] } : {}),
                ...(change[4] ? change[4] : {}),
            }
        }),
    ]
}

function blockStats(params: { userId: number | string; usedBlocks: number }) {
    return {
        id: expect.anything(),
        createdWhen: expect.any(Number),
        usedBlocks: params.usedBlocks,
        lastChange: expect.any(Number),
        user: params.userId,
    }
}

const DEFAULT_DEVICE_USERS = [TEST_USER.email, TEST_USER.email]

async function setup(options?: {
    /** Denotes whether or not to run storage hooks. */
    withStorageHooks?: boolean
    /** Length of the array is # of devices, with each value being the user of that indices device. */
    deviceUsers?: AutoPk[]
}) {
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

            if (sqlUserId) {
                for (const objects of Object.values(params.merged)) {
                    for (const object of Object.values(objects)) {
                        if ('user' in object) {
                            object.user = sqlUserId
                        }
                    }
                }
            }
        },
    })

    const fakeFetch = new FakeFetch()
    const captureException: ExceptionCapturer = async (err) => {
        console.warn('Got error in content sharing backend', err.message)
    }
    const deviceUsers = options?.deviceUsers ?? DEFAULT_DEVICE_USERS
    const deviceUsersSet = new Set(deviceUsers)
    if (!deviceUsers.length) {
        throw new Error('Sync test must have at least one device')
    }
    const storageHooksChangeWatchers = new Map(
        [...deviceUsersSet].map((user) => [
            user,
            new StorageHooksChangeWatcher(),
        ]),
    )

    const serverChangeWatchSettings: ChangeWatchMiddlewareSettings[] = options?.withStorageHooks
        ? [...storageHooksChangeWatchers.values()]
        : [...deviceUsersSet].map(() => ({
              shouldWatchCollection: (collection) =>
                  collection.startsWith('personal'),
              postprocessOperation: async (context) => {
                  await serverIdCapturer.handlePostStorageChange(context)
              },
          }))

    const {
        setups,
        serverStorage,
        getSqlStorageMananager,
        getNow,
    } = await setupSyncBackgroundTest({
        deviceCount: deviceUsers.length,
        serverChangeWatchSettings,
        fakeFetch,
    })

    for (let deviceIndex = 0; deviceIndex < deviceUsers.length; deviceIndex++) {
        await setups[deviceIndex].authService.loginWithEmailAndPassword(
            deviceUsers[deviceIndex].toString(),
            'password',
        )
    }

    let sqlUserId: number | string | undefined
    if (getSqlStorageMananager) {
        const initDeps: InitSqlUsageParams = {
            storageManager: serverStorage.manager,
            getSqlStorageMananager,
            userId: TEST_USER.id,
        }
        await initSqlUsage(initDeps)
        sqlUserId = initDeps.userId
    }

    const serverStorageManager =
        (await getSqlStorageMananager?.()) ?? serverStorage.manager
    serverIdCapturer.setup(serverStorageManager)
    for (const user of deviceUsersSet) {
        storageHooksChangeWatchers.get(user).setUp({
            getNow,
            normalizeUrl,
            getFunctionsConfig: () => ({
                content_sharing: {
                    cloudflare_worker_credentials: 'fake-creds',
                },
            }),
            fetch: fakeFetch.fetch as any,
            captureException,
            serverStorageManager,
            getSqlStorageMananager,
            getCurrentUserReference: async () => ({
                id: user,
                type: 'user-reference',
            }),
            services: {
                activityStreams: setups[0].services.activityStreams,
            },
        })
    }

    const getPersonalWhere = (collection: string) => {
        if (collection.startsWith('personal')) {
            return { user: sqlUserId ?? TEST_USER.id }
        }
    }

    return {
        serverIdCapturer,
        setups,
        serverStorageManager,
        getPersonalWhere,
        personalDataChanges: (
            remoteData: typeof REMOTE_TEST_DATA_V24,
            changes: DataChange[],
            options?: DataChangeAssertOpts,
        ) => ({
            personalDataChange: dataChanges(
                remoteData,
                sqlUserId ?? TEST_USER.id,
                changes,
                options,
            ),
        }),
        personalBlockStats: (params: { usedBlocks: number }) =>
            blockStats({
                ...params,
                userId: sqlUserId ?? TEST_USER.id,
            }),
        getDatabaseContents: async (
            collections: string[],
            options?: { getWhere?(collection: string): any },
        ) => {
            return getCrossDatabaseContents(
                serverStorage.manager,
                getSqlStorageMananager,
                collections,
                options,
            )
        },
        testSyncPushTrigger: (opts: {
            wasTriggered: boolean
            pushMessagingService?: MockPushMessagingService
        }) => {
            const pushMessagingService =
                opts.pushMessagingService ?? setups[0].pushMessagingService
            expect(pushMessagingService.sentMessages[0]).toEqual(
                opts.wasTriggered
                    ? {
                          type: 'to-user',
                          userId: TEST_USER.email,
                          payload: {
                              type: 'downloadClientUpdates',
                          },
                      }
                    : undefined,
            )
        },
        testDownload: async (
            expected: PersonalCloudUpdateBatch,
            downloadOptions?: {
                skip?: number
                deviceIndex?: number
                userId?: AutoPk
                queryResultLimit?: number
                clientSchemaVersion?: Date
            },
        ) => {
            const clientSchemaVersion =
                downloadOptions?.clientSchemaVersion ??
                STORAGE_VERSIONS[37].version
            const { batch } = await downloadClientUpdates({
                getNow,
                startTime: 0,
                clientSchemaVersion,
                getConfig: () => ({}),
                captureException,
                fetch: fakeFetch.fetch as any,
                userId: downloadOptions?.userId ?? TEST_USER.id,
                storageManager: serverStorage.manager,
                __queryResultLimit: downloadOptions?.queryResultLimit,
                getSqlStorageMananager,
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
        fakeFetch,
        // TODO: Decouple this from readwise highlight reqs - maybe just use the above fakeFetch in assertions
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
            const { setups, testDownload, testSyncPushTrigger } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // prettier-ignore
            await testDownload([], { deviceIndex: 0 })
        })

        it('should create pages', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)

            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                ]),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update pages', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
                fakeFetch,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            // Add a shared annotation to trigger creation of sharedPageInfo for our page
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
            const updatedTitle = 'Updated title'

            expect(fakeFetch.capturedReqs).toEqual([])
            const localPage: PipelineRes = await setups[0].storageManager
                .collection('pages')
                .findOneObject({
                    url: LOCAL_TEST_DATA_V24.pages.first.url,
                })
            expect(localPage).toEqual({
                ...LOCAL_TEST_DATA_V24.pages.first,
                titleTerms: expect.any(Array),
                urlTerms: expect.any(Array),
            })

            await setups[0].backgroundModules.pages.updatePageTitle({
                normaliedPageUrl: LOCAL_TEST_DATA_V24.pages.first.url,
                title: updatedTitle,
            })
            expect(
                await setups[0].storageManager
                    .collection('pages')
                    .findOneObject({
                        url: LOCAL_TEST_DATA_V24.pages.first.url,
                    }),
            ).toEqual({
                ...LOCAL_TEST_DATA_V24.pages.first,
                fullTitle: updatedTitle,
                titleTerms: mergeTermFields(
                    'titleTerms',
                    { titleTerms: extractTerms(updatedTitle) },
                    { titleTerms: localPage.titleTerms },
                ),
                urlTerms: expect.any(Array),
            })

            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testListShares = remoteData.personalListShare
            const testLocators = remoteData.personalContentLocator

            expect(fakeFetch.capturedReqs).toEqual([
                [
                    CLOUDFLARE_WORKER_URLS.staging +
                        SHARED_LIST_TIMESTAMP_SET_ROUTE,
                    {
                        method: 'POST',
                        headers: expect.anything(),
                        body: expect.any(String),
                    },
                ],
            ])
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'sharedPageInfo',
                    'sharedListEntry',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id],
                ], { skipChanges: 10 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
                personalContentMetadata: [
                    {
                        ...testMetadata.first,
                        title: updatedTitle,
                    },
                    testMetadata.second,
                ],
                personalContentLocator: [testLocators.first, testLocators.second],
                sharedPageInfo: [{
                    id: expect.anything(),
                    creator: TEST_USER.id,
                    fullTitle: updatedTitle,
                    normalizedUrl: localPage.url,
                    originalUrl: localPage.fullUrl,
                    updatedWhen: expect.anything(),
                    createdWhen: expect.anything(),
                }],
                sharedListEntry: [{
                    id: expect.anything(),
                    creator: TEST_USER.id,
                    entryTitle: updatedTitle,
                    sharedList: testListShares.first.remoteId,
                    normalizedUrl: testLocators.first.location,
                    originalUrl: testLocators.first.originalLocation,
                    createdWhen: expect.anything(),
                    updatedWhen: expect.anything(),
                }],
            })
            // prettier-ignore
            await testDownload([
                {
                    type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: {
                        ...LOCAL_TEST_DATA_V24.pages.first,
                        fullTitle: updatedTitle
                    },
                },
            ], { skip: 7 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update page titles', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete pages', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            // Adding pageMetadata here as it should also get deleted on DL as a result of page delete
            await setups[0].storageManager
                .collection('pageMetadata')
                .createObject(LOCAL_TEST_DATA_V24.pageMetadata.first)
            await setups[0].storageManager.collection('pages').deleteObjects({
                url: LOCAL_TEST_DATA_V24.pages.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id, {
                        pageMetadata: true,
                    }],
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.first.id, {
                        normalizedUrl: testLocators.first.location
                    }],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 1 })],
                personalContentMetadata: [testMetadata.second],
                personalContentLocator: [testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'pages', where: { url: LOCAL_TEST_DATA_V24.pages.first.url } },
                { type: PersonalCloudUpdateType.Delete, collection: 'pageMetadata', where: { normalizedPageUrl: LOCAL_TEST_DATA_V24.pages.first.url } },
            ], { skip: 1 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create page metadata and entities', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('pageMetadata')
                .createObject(LOCAL_TEST_DATA_V24.pageMetadata.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.second)

            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testEntities = remoteData.personalContentEntity
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentEntity',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id, { pageMetadata: true }],
                    [DataChangeType.Create, 'personalContentEntity', testEntities.first.id],
                    [DataChangeType.Create, 'personalContentEntity', testEntities.second.id],
                ]),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [{ ...testMetadata.first, ...REMOTE_METADATA_V24_AMENDED.first }, testMetadata.second],
                personalContentEntity: [testEntities.first, testEntities.second],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageMetadata', object: LOCAL_TEST_DATA_V24.pageMetadata.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: LOCAL_TEST_DATA_V24.pageEntities.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: LOCAL_TEST_DATA_V24.pageEntities.second },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update page metadata and entities', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('pageMetadata')
                .createObject(LOCAL_TEST_DATA_V24.pageMetadata.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // First try to update an entity
            const updatedEntityName = 'updated name'
            await setups[0].storageManager
                .collection('pageEntities')
                .updateOneObject(
                    {
                        id: LOCAL_TEST_DATA_V24.pageEntities.first.id,
                    },
                    {
                        name: updatedEntityName,
                    },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testEntities = remoteData.personalContentEntity
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentEntity',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentEntity', testEntities.first.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [{ ...testMetadata.first, ...REMOTE_METADATA_V24_AMENDED.first }, testMetadata.second],
                personalContentEntity: [{ ...testEntities.first, name: updatedEntityName }, testEntities.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: { ...LOCAL_TEST_DATA_V24.pageEntities.first, name: updatedEntityName } },
            ], { skip: 5 })
            testSyncPushTrigger({ wasTriggered: true })

            // Next try to update page metadata
            const metadata = {
                doi: undefined,
                journalPage: 'p3423424',
                journalName: 'my journal',
                journalIssue: 'best issue',
                journalVolume: 'newest volume',
            }
            await setups[0].storageManager
                .collection('pageMetadata')
                .updateOneObject(
                    {
                        normalizedPageUrl:
                            LOCAL_TEST_DATA_V24.pageMetadata.first
                                .normalizedPageUrl,
                    },
                    metadata,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentEntity',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentEntity', testEntities.first.id],
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id, { pageMetadata: true }],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [{ ...testMetadata.first, ...REMOTE_METADATA_V24_AMENDED.first, ...metadata }, testMetadata.second],
                personalContentEntity: [{ ...testEntities.first, name: updatedEntityName }, testEntities.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: { ...LOCAL_TEST_DATA_V24.pageEntities.first, name: updatedEntityName } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageMetadata', object: { ...LOCAL_TEST_DATA_V24.pageMetadata.first, ...metadata } },
            ], { skip: 5 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete page entities', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('pageMetadata')
                .createObject(LOCAL_TEST_DATA_V24.pageMetadata.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.first)
            await setups[0].storageManager
                .collection('pageEntities')
                .createObject(LOCAL_TEST_DATA_V24.pageEntities.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            await setups[0].storageManager
                .collection('pageEntities')
                .deleteObjects({
                    normalizedPageUrl:
                        LOCAL_TEST_DATA_V24.pageEntities.first
                            .normalizedPageUrl,
                })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testEntities = remoteData.personalContentEntity
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentEntity',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id, { pageMetadata: true }],
                    [DataChangeType.Create, 'personalContentEntity', testEntities.first.id],
                    [DataChangeType.Create, 'personalContentEntity', testEntities.second.id],
                    [DataChangeType.Delete, 'personalContentEntity', testEntities.first.id, { localId: testEntities.first.localId }],
                    [DataChangeType.Delete, 'personalContentEntity', testEntities.second.id, { localId: testEntities.second.localId }],
                ]),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [{ ...testMetadata.first, ...REMOTE_METADATA_V24_AMENDED.first }, testMetadata.second],
                personalContentEntity: [],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageMetadata', object: LOCAL_TEST_DATA_V24.pageMetadata.first },
                // { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: LOCAL_TEST_DATA_V24.pageEntities.first },
                // { type: PersonalCloudUpdateType.Overwrite, collection: 'pageEntities', object: LOCAL_TEST_DATA_V24.pageEntities.second },
                { type: PersonalCloudUpdateType.Delete, collection: 'pageEntities', where: { id: LOCAL_TEST_DATA_V24.pageEntities.first.id } },
                { type: PersonalCloudUpdateType.Delete, collection: 'pageEntities', where: { id: LOCAL_TEST_DATA_V24.pageEntities.second.id } },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create locators', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
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
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.fourth_uploading)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.third.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third_base.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.fourth.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_base.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_a.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_b.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_c_uploading.id],
                ], { skipAssertTimestamp: true }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third, testMetadata.fourth],
                personalContentLocator: [
                    testLocators.first, testLocators.second,
                    testLocators.third_base, testLocators.third,
                    testLocators.fourth_base, testLocators.fourth_a, testLocators.fourth_b, testLocators.fourth_c_uploading],
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
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploading },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update locators', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
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
            await setups[0].storageManager
                .collection('locators')
                .createObject(LOCAL_TEST_DATA_V24.locators.fourth_uploading)
            await setups[0].backgroundModules.pages.storage.updateLocatorStatus(
                {
                    normalizedUrl:
                        LOCAL_TEST_DATA_V24.locators.fourth_uploading
                            .normalizedUrl,
                    locationScheme: LocationSchemeType.UploadStorage,
                    status: 'uploaded',
                },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'sharedContentLocator',
                    'sharedContentFingerprint',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.third.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third_base.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.fourth.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_base.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_a.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_b.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.fourth_c_uploading.id],
                    [DataChangeType.Modify, 'personalContentLocator', testLocators.fourth_c_uploading.id],
                ], { skipAssertTimestamp: true }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third, testMetadata.fourth],
                personalContentLocator: [
                    testLocators.first, testLocators.second,
                    testLocators.third_base, testLocators.third,
                    testLocators.fourth_base, testLocators.fourth_a, testLocators.fourth_b, testLocators.fourth_c_uploaded,
                ],
                sharedContentLocator: [
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        locationScheme: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.locationScheme,
                        normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                        originalUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.originalLocation,
                        location: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.location,
                        // sharedList: null,
                    },
                ],
                sharedContentFingerprint: [
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        normalizedUrl: testLocators.third_base.location,
                        fingerprint: testLocators.third.fingerprint,
                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                        // sharedList: null
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        normalizedUrl: testLocators.fourth_base.location,
                        fingerprint: testLocators.fourth_a.fingerprint,
                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                        // sharedList: null
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        normalizedUrl: testLocators.fourth_base.location,
                        fingerprint: testLocators.fourth_b.fingerprint,
                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                        // sharedList: null
                    },
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_b },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete locators', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.third.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third_base.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.third.id],
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.third.id, {
                        normalizedUrl: testLocators.third_base.location,
                    }],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.third_base.id],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.third.id, {
                        id: testLocators.third.localId,
                    }],
                ], { skipChanges: 0, skipAssertTimestamp: true }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator:  [testLocators.first, testLocators.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.second },
                { type: PersonalCloudUpdateType.Delete, collection: 'pages', where: { url: LOCAL_TEST_DATA_V24.pages.third.url } },
                { type: PersonalCloudUpdateType.Delete, collection: 'pageMetadata', where: { normalizedPageUrl: LOCAL_TEST_DATA_V24.pages.third.url } },
                { type: PersonalCloudUpdateType.Delete, collection: 'locators', where: { id: LOCAL_TEST_DATA_V24.locators.third.id } },
            ])
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create bookmarks', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalBookmark',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalBookmark', testBookmarks.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalBookmark: [testBookmarks.first]
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'bookmarks', object: LOCAL_TEST_DATA_V24.bookmarks.first },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete bookmarks', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalBookmark',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalBookmark', testBookmarks.first.id, changeInfo],
                ], { skipChanges: 5 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalBookmark: []
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'bookmarks', where: changeInfo },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentRead', testReads.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            const updatedDuration =
                LOCAL_TEST_DATA_V24.visits.first.duration * 2

            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentRead', testReads.first.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete visits', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
                ], { skipChanges: 8 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create annotations', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update annotation notes', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotation', testAnnotations.first.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update annotation highlights', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject(
                    LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                )
            const updatedHighlight = 'This is an updated highlight'
            const lastEdited = new Date()
            await setups[0].storageManager
                .collection('annotations')
                .updateOneObject(
                    { url: LOCAL_TEST_DATA_V24.annotations.first.url },
                    { body: updatedHighlight, lastEdited },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'sharedAnnotation',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotation', testAnnotations.first.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [{ ...testAnnotations.first, body: updatedHighlight, updatedWhen: lastEdited.getTime() }],
                personalAnnotationSelector: [testSelectors.first],
                sharedAnnotation: [expect.objectContaining({
                    selector: JSON.stringify(LOCAL_TEST_DATA_V24.annotations.first.selector),
                    body: updatedHighlight,
                    comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                    color: LOCAL_TEST_DATA_V24.annotations.first.color,
                    createdWhen: LOCAL_TEST_DATA_V24.annotations.first.createdWhen.valueOf(),
                    updatedWhen: expect.any(Number), // TODO: Be able to assert that timestamp has increased
                })]
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'annotations',
                        object: {
                            ...LOCAL_TEST_DATA_V24.annotations.first,
                            body: updatedHighlight,
                            lastEdited,
                        },
                    },
                ],
                { skip: 4 },
            )
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete annotations', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.first.id, { url: LOCAL_TEST_DATA_V24.annotations.first.url }],
                    [DataChangeType.Delete, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.second.id, { url: LOCAL_TEST_DATA_V24.annotations.second.url }],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.second.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
                        color: LOCAL_TEST_DATA_V24.annotations.first.color,
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update annotation privacy levels, re-sharing on update to shared privacy level', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testAnnotationShares = remoteData.personalAnnotationShare
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                ], { skipChanges: 8 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
                        color: LOCAL_TEST_DATA_V24.annotations.first.color,
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete annotation privacy levels', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id, changeInfo],
                ], { skipChanges: 9 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create custom lists', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                    [DataChangeType.Create, 'personalList', testLists.third.id],
                    [DataChangeType.Create, 'personalList', testLists.fourth.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                personalList: [testLists.first, testLists.second, testLists.third, testLists.fourth],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.fourth },
            ], { skip: 0 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update custom lists', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create custom list trees', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
            // await setups[0].storageManager
            //     .collection('customListTrees')
            //     .createObject(LOCAL_TEST_DATA_V24.customListTrees.fifth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListTrees = remoteData.personalListTree
            const testListShares = remoteData.personalListShare

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                    'personalListTree',
                    'sharedListTree',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalListTree', testListTrees.first.id],
                    [DataChangeType.Create, 'personalListTree', testListTrees.second.id],
                    [DataChangeType.Create, 'personalListTree', testListTrees.third.id],
                    [DataChangeType.Create, 'personalListTree', testListTrees.fourth.id],
                    // [DataChangeType.Create, 'personalListTree', testListTrees.fifth.id],
                ], { skipChanges: 8 }),
                personalBlockStats: [],
                personalList: [testLists.first, testLists.second, testLists.third, testLists.fourth],
                personalListTree: [testListTrees.first, testListTrees.second, testListTrees.third, testListTrees.fourth, /* testListTrees.fifth */],
                sharedListTree: [
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: testListTrees.first.order,
                        sharedList: testListShares.first.remoteId,
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: testListTrees.second.order,
                        sharedList: testListShares.second.remoteId,
                        parentListId:testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: testListTrees.third.order,
                        sharedList: testListShares.third.remoteId,
                        parentListId:testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: testListTrees.fourth.order,
                        sharedList: testListShares.fourth.remoteId,
                        parentListId:testListShares.third.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId, testListShares.third.remoteId),
                    }),
                    // expect.objectContaining({
                    //     creator: TEST_USER.id,
                    //     order: testListTrees.fifth.order,
                    //     linkTarget: testListShares.first.remoteId,
                    //     parentListId:testListShares.second.remoteId,
                    //     path: buildMaterializedPath(testListShares.first.remoteId, testListShares.second.remoteId),
                    // }),
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.third },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.fourth },
                // { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.fifth },
            ], { skip: 8 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        // TODO: Fix
        it.skip('should update order of custom list trees', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
            // await setups[0].storageManager
            //     .collection('customListTrees')
            //     .createObject(LOCAL_TEST_DATA_V24.customListTrees.fifth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListTrees = remoteData.personalListTree
            const testListShares = remoteData.personalListShare

            const siblingListIds = [
                LOCAL_TEST_DATA_V24.customListTrees.first.listId,
                LOCAL_TEST_DATA_V24.customListTrees.second.listId,
                LOCAL_TEST_DATA_V24.customListTrees.third.listId,
                LOCAL_TEST_DATA_V24.customListTrees.fourth.listId,
                // LOCAL_TEST_DATA_V24.customListTrees.fifth.listId,
            ]
            const nowA = 12345
            const nowB = 12346
            const nowC = 12347
            // Move the first to be the third
            await setups[0].backgroundModules.customLists.updateListTreeOrder({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.first.listId,
                intendedIndexAmongSiblings: 2,
                siblingListIds,
                now: nowA,
            })
            // Move the fourth to be the first
            await setups[0].backgroundModules.customLists.updateListTreeOrder({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.fourth.listId,
                intendedIndexAmongSiblings: 0,
                siblingListIds,
                now: nowB,
            })
            // Move the third to be the first
            await setups[0].backgroundModules.customLists.updateListTreeOrder({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.third.listId,
                intendedIndexAmongSiblings: 1,
                siblingListIds,
                now: nowC,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalList',
                    'personalListTree',
                    'sharedListTree',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalListTree', testListTrees.first.id],
                    [DataChangeType.Modify, 'personalListTree', testListTrees.fourth.id],
                    [DataChangeType.Modify, 'personalListTree', testListTrees.third.id],
                ], { skipChanges: 12 }),
                personalBlockStats: [],
                personalList: [testLists.first, testLists.second, testLists.third, testLists.fourth],
                personalListTree: [{
                    ...testListTrees.first,
                    order: 15,
                    updatedWhen: nowA,
                }, testListTrees.second, {
                    ...testListTrees.third,
                    order: 7,
                    updatedWhen: nowC,
                }, {
                    ...testListTrees.fourth,
                    order: 5,
                    updatedWhen: nowB,
                },
                // testListTrees.fifth,
                ],
                sharedListTree: [
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: 15,
                        sharedList: testListShares.first.remoteId,
                        updatedWhen: nowA,
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: testListTrees.second.order,
                        sharedList: testListShares.second.remoteId,
                        parentListId:testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: 7,
                        sharedList: testListShares.third.remoteId,
                        parentListId:testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                        updatedWhen: nowC,
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        order: 5,
                        sharedList: testListShares.fourth.remoteId,
                        parentListId:testListShares.third.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId, testListShares.third.remoteId),
                        updatedWhen: nowB,
                    }),
                    // expect.objectContaining({
                    //     creator: TEST_USER.id,
                    //     order: testListTrees.fifth.order,
                    //     linkTarget: testListShares.first.remoteId,
                    //     parentListId:testListShares.second.remoteId,
                    //     path: buildMaterializedPath(testListShares.first.remoteId, testListShares.second.remoteId),
                    // }),
                ],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.first,
                    order: 15,
                    updatedWhen: nowA,
                } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.third ,
                    order: 7,
                    updatedWhen: nowC,
                } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.fourth,
                    order: 5,
                    updatedWhen: nowB,
                } },
                // { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: LOCAL_TEST_DATA_V24.customListTrees.fifth },
                // TODO: Figure out why these ones get re-downloaded (the last one actually isn't - what's different?)
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.first,
                    order: 15,
                    updatedWhen: nowA,
                } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.fourth,
                    order: 5,
                    updatedWhen: nowB,
                } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListTrees', object: {
                    ...LOCAL_TEST_DATA_V24.customListTrees.third,
                    order: 7,
                    updatedWhen: nowC,
                } },
            ], { skip: 8 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should be able to move custom list trees', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                testSyncPushTrigger,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const nowA = Date.now()

            const listTreesData = cloneDeep(LOCAL_TEST_DATA_V24.customListTrees)

            const assertExpectedLocalTreeData = async () => {
                const expectedLocalData = [
                    listTreesData.first,
                    listTreesData.second,
                    listTreesData.third,
                    listTreesData.fourth,
                ].map((data) => ({
                    ...data,
                    order: expect.any(Number),
                    updatedWhen: expect.anything(),
                    createdWhen: expect.anything(),
                }))

                expect(
                    await setups[0].storageManager
                        .collection('customListTrees')
                        .findAllObjects({}),
                ).toEqual(expectedLocalData)
                await setups[0].backgroundModules.personalCloud.waitForSync()
                // TODO: This delay shouldn't be necessary (and probably inconsistently fails).
                //  Only here as sync updates get received on second device a little after waitForSync runs here. This seems to fix it most of the time.
                await delay(100)
                await setups[1].backgroundModules.personalCloud.waitForSync()
                expect(
                    await setups[1].storageManager
                        .collection('customListTrees')
                        .findAllObjects({}),
                ).toEqual(expectedLocalData)
            }

            await assertExpectedLocalTreeData()

            // Move a subtree (with child) to be the child of its sibling - should update both subtree root and child ancestor refs
            await setups[0].backgroundModules.customLists.updateListTreeParent({
                localListId: listTreesData.third.listId,
                parentListId: listTreesData.second.listId,
                now: nowA,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // Update test data to have expected post-reordering values
            listTreesData.third = {
                ...listTreesData.third,
                updatedWhen: nowA,
                parentListId: listTreesData.second.listId,
                path: buildMaterializedPath(
                    listTreesData.first.listId,
                    listTreesData.second.listId,
                ),
            }
            listTreesData.fourth = {
                ...listTreesData.fourth,
                updatedWhen: nowA,
                parentListId: listTreesData.third.listId, // Unchanged
                path: buildMaterializedPath(
                    listTreesData.first.listId,
                    listTreesData.second.listId,
                    listTreesData.third.listId,
                ),
            }
            await assertExpectedLocalTreeData()

            const remoteDataA = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListA = remoteDataA.personalList
            const testListTreesA = remoteDataA.personalListTree
            const testListSharesA = remoteDataA.personalListShare

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalDataChange',
                    'personalListTree',
                    'sharedListTree',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteDataA, [
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTreesA.third.id, {
                        localListId: testListA.third.localId,
                        parentLocalListId: testListA.second.localId,
                    }],
                ], { skipChanges: 12, skipAssertTimestamp: true }),
                personalListTree: [
                    testListTreesA.first,
                    testListTreesA.second,
                    {
                        ...testListTreesA.third,
                        path: buildMaterializedPath(
                            testListTreesA.first.personalList,
                            testListTreesA.second.personalList,
                        ),
                        parentListId: testListTreesA.second.personalList,
                        localPath: listTreesData.third.path,
                        localParentListId: listTreesData.third.parentListId,
                    },
                    {
                        ...testListTreesA.fourth,
                        path: buildMaterializedPath(
                            testListTreesA.first.personalList,
                            testListTreesA.second.personalList,
                            testListTreesA.third.personalList,
                        ),
                        localPath: listTreesData.fourth.path,
                    },
                ],
                sharedListTree: [
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesA.first.order,
                        sharedList: testListSharesA.first.remoteId,
                        parentListId: ROOT_NODE_PARENT_ID,
                        // path: null,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesA.second.order,
                        sharedList: testListSharesA.second.remoteId,
                        parentListId: testListSharesA.first.remoteId,
                        path: buildMaterializedPath(testListSharesA.first.remoteId),
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesA.third.order,
                        sharedList: testListSharesA.third.remoteId,
                        parentListId: testListSharesA.second.remoteId,
                        path: buildMaterializedPath(
                            testListSharesA.first.remoteId,
                            testListSharesA.second.remoteId,
                        ),
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesA.fourth.order,
                        sharedList: testListSharesA.fourth.remoteId,
                        parentListId: testListSharesA.third.remoteId,
                        path: buildMaterializedPath(
                            testListSharesA.first.remoteId,
                            testListSharesA.second.remoteId,
                            testListSharesA.third.remoteId,
                        ),
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
            })

            const nowB = Date.now()
            // Move new parent of subtree from prev call to be tree of its own - should affect everything but the root of the old tree
            await setups[0].backgroundModules.customLists.updateListTreeParent({
                localListId: listTreesData.second.listId,
                parentListId: null,
                now: nowB,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // Update test data to have expected post-reordering values
            listTreesData.second = {
                ...listTreesData.second,
                updatedWhen: nowB,
                parentListId: ROOT_NODE_PARENT_ID,
                path: null,
            }
            listTreesData.third = {
                ...listTreesData.third,
                updatedWhen: nowB,
                parentListId: listTreesData.second.listId, // Unchanged
                path: buildMaterializedPath(listTreesData.second.listId),
            }
            listTreesData.fourth = {
                ...listTreesData.fourth,
                updatedWhen: nowB,
                parentListId: listTreesData.third.listId, // Unchanged
                path: buildMaterializedPath(
                    listTreesData.second.listId,
                    listTreesData.third.listId,
                ),
            }
            await assertExpectedLocalTreeData()

            const remoteDataB = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListTreesB = remoteDataB.personalListTree
            const testListSharesB = remoteDataB.personalListShare

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalDataChange',
                    'personalListTree',
                    'sharedListTree',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteDataB, [
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTreesA.third.id, {
                        localListId: testListA.third.localId,
                        parentLocalListId: testListA.second.localId,
                    }],
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTreesA.second.id, {
                        localListId: testListA.second.localId,
                        parentLocalListId: null,
                    }],
                ], { skipChanges: 12, skipAssertTimestamp: true }),
                personalListTree: [
                    testListTreesB.first,
                    {
                        ...testListTreesB.second,
                        // TODO: Currently I'm deleting all null fields on DB read (see `deleteNullFields`), thus these fields end up as `undefined`. Fix this up
                        // path: null,
                        // parentListId: null,
                        // localPath: listTreesData.second.path,
                        // localParentListId: listTreesData.second.parentListId,
                        path: undefined,
                        parentListId: ROOT_NODE_PARENT_ID,
                        localPath: undefined,
                        localParentListId: undefined,
                    },
                    {
                        ...testListTreesB.third,
                        path: buildMaterializedPath(testListTreesB.second.personalList),
                        parentListId: testListTreesB.second.personalList,
                        localPath: listTreesData.third.path,
                        localParentListId: listTreesData.third.parentListId,
                    },
                    {
                        ...testListTreesB.fourth,
                        parentListId: testListTreesB.third.personalList,
                        path: buildMaterializedPath(
                            testListTreesB.second.personalList,
                            testListTreesB.third.personalList,
                        ),
                        localPath: listTreesData.fourth.path,
                    },
                ],
                sharedListTree: [
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesB.first.order,
                        sharedList: testListSharesB.first.remoteId,
                        parentListId: ROOT_NODE_PARENT_ID,
                        // path: null,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesB.second.order,
                        sharedList: testListSharesB.second.remoteId,
                        parentListId: ROOT_NODE_PARENT_ID,
                        // path: null,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesB.third.order,
                        sharedList: testListSharesB.third.remoteId,
                        parentListId: testListSharesB.second.remoteId,
                        path: buildMaterializedPath(testListSharesB.second.remoteId),
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        id: expect.anything(),
                        creator: TEST_USER.id,
                        order: testListTreesB.fourth.order,
                        sharedList: testListSharesB.fourth.remoteId,
                        parentListId: testListSharesB.third.remoteId,
                        path: buildMaterializedPath(
                            testListSharesB.second.remoteId,
                            testListSharesB.third.remoteId,
                        ),
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
            })

            // prettier - ignore
            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.ListTreeMove,
                        rootNodeLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.third.id,
                        parentLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.second.id,
                    },
                    {
                        type: PersonalCloudUpdateType.ListTreeMove,
                        rootNodeLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.second.id,
                        parentLocalListId: null,
                    },
                ],
                { skip: 12 },
            )

            testSyncPushTrigger({ wasTriggered: true })
        })

        // TODO: Remove this and compat code in tree move+delete code
        it.skip('should move custom list trees when tree data does not yet exist (pre-nested lists data)', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                testSyncPushTrigger,
                getDatabaseContents,
                personalDataChanges,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const nowA = Date.now()

            expect(
                await setups[0].storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([])

            // Recreate the tree structure in the test data with manual update calls
            await setups[0].backgroundModules.customLists.updateListTreeParent({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.second.listId,
                parentListId: LOCAL_TEST_DATA_V24.customListTrees.first.listId,
                now: nowA,
            })
            await setups[0].backgroundModules.customLists.updateListTreeParent({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.third.listId,
                parentListId: LOCAL_TEST_DATA_V24.customListTrees.first.listId,
                now: nowA,
            })
            await setups[0].backgroundModules.customLists.updateListTreeParent({
                localListId: LOCAL_TEST_DATA_V24.customListTrees.fourth.listId,
                parentListId: LOCAL_TEST_DATA_V24.customListTrees.third.listId,
                now: nowA,
            })

            const expectedLocalData = [
                LOCAL_TEST_DATA_V24.customListTrees.first,
                LOCAL_TEST_DATA_V24.customListTrees.second,
                LOCAL_TEST_DATA_V24.customListTrees.third,
                LOCAL_TEST_DATA_V24.customListTrees.fourth,
            ].map((data) => ({
                ...data,
                id: expect.any(Number),
                order: expect.any(Number),
                updatedWhen: expect.anything(),
                createdWhen: expect.anything(),
            }))

            const localDataA: ListTree[] = await setups[0].storageManager
                .collection('customListTrees')
                .findAllObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()
            // TODO: This delay shouldn't be necessary (and probably inconsistently fails).
            //  Only here as sync updates get received on second device a little after waitForSync runs here. This seems to fix it most of the time.
            await delay(100)
            await setups[1].backgroundModules.personalCloud.waitForSync()
            const localDataB: ListTree[] = await setups[1].storageManager
                .collection('customListTrees')
                .findAllObjects({})
            expect(localDataA).toEqual(expectedLocalData)
            expect(localDataB).toEqual(expectedLocalData)

            // Third list gets made a sibling of the second, thus it should be inserted in the first position
            expect(localDataA[2].order).toBeLessThan(localDataA[1].order)
            expect(localDataB[2].order).toBeLessThan(localDataB[1].order)

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testList = remoteData.personalList
            const testListTrees = remoteData.personalListTree
            const testListShares = remoteData.personalListShare

            const cloudData = await getDatabaseContents(
                ['personalDataChange', 'personalListTree', 'sharedListTree'],
                { getWhere: getPersonalWhere },
            )

            // Again, check order of third and second siblings but on cloud-side
            expect(cloudData.personalListTree[2].order).toBeLessThan(
                cloudData.personalListTree[1].order,
            )
            expect(cloudData.sharedListTree[2].order).toBeLessThan(
                cloudData.sharedListTree[1].order,
            )

            // prettier-ignore
            expect(cloudData).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalListTree', testListTrees.first.id],
                    [DataChangeType.Create, 'personalListTree', testListTrees.second.id],
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTrees.second.id, {
                        localListId: testList.second.localId,
                        parentLocalListId: testList.first.localId,
                    }],
                    [DataChangeType.Create, 'personalListTree', testListTrees.third.id],
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTrees.third.id, {
                        localListId: testList.third.localId,
                        parentLocalListId: testList.first.localId,
                    }],
                    [DataChangeType.Create, 'personalListTree', testListTrees.fourth.id],
                    [DataChangeType.ListTreeMove, 'personalListTree', testListTrees.fourth.id, {
                        localListId: testList.fourth.localId,
                        parentLocalListId: testList.third.localId,
                    }],
                ], { skipChanges: 8, skipAssertTimestamp: true }),
                personalListTree: [testListTrees.first, testListTrees.second, testListTrees.third, testListTrees.fourth]
                    .map((data, i) => ({
                        ...data,
                        localId: Object.values(LOCAL_TEST_DATA_V24.customLists)[i].id,
                        order: expect.any(Number),
                    })),
                sharedListTree: expect.arrayContaining([
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        parentListId: ROOT_NODE_PARENT_ID,
                        sharedList: testListShares.first.remoteId,
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        sharedList: testListShares.second.remoteId,
                        parentListId: testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        sharedList: testListShares.third.remoteId,
                        parentListId: testListShares.first.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId),
                    }),
                    expect.objectContaining({
                        creator: TEST_USER.id,
                        sharedList: testListShares.fourth.remoteId,
                        parentListId: testListShares.third.remoteId,
                        path: buildMaterializedPath(testListShares.first.remoteId, testListShares.third.remoteId),
                    }),
                ]),
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.ListTreeMove,
                        rootNodeLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.second.id,
                        parentLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.first.id,
                    },
                    {
                        type: PersonalCloudUpdateType.ListTreeMove,
                        rootNodeLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.third.id,
                        parentLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.first.id,
                    },
                    {
                        type: PersonalCloudUpdateType.ListTreeMove,
                        rootNodeLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.fourth.id,
                        parentLocalListId:
                            LOCAL_TEST_DATA_V24.customLists.third.id,
                    },
                ],
                { skip: 8 },
            )
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should not allow move of custom list tree that introduces a cycle', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                testSyncPushTrigger,
                getDatabaseContents,
                testDownload,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const nowA = Date.now()

            const assertExpectedLocalTreeData = async () =>
                expect(
                    await setups[0].storageManager
                        .collection('customListTrees')
                        .findAllObjects({}),
                ).toEqual([
                    LOCAL_TEST_DATA_V24.customListTrees.first,
                    LOCAL_TEST_DATA_V24.customListTrees.second,
                    LOCAL_TEST_DATA_V24.customListTrees.third,
                    LOCAL_TEST_DATA_V24.customListTrees.fourth,
                ])

            await assertExpectedLocalTreeData()

            // Attempt to introduce a cycle by making grandparent list child of current grandchild
            let error: Error
            try {
                await setups[0].backgroundModules.customLists.updateListTreeParent(
                    {
                        localListId:
                            LOCAL_TEST_DATA_V24.customListTrees.first.listId,
                        parentListId:
                            LOCAL_TEST_DATA_V24.customListTrees.third.listId,
                        now: nowA,
                    },
                )
            } catch (e) {
                error = e
            }
            expect(error).toBeDefined()
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await assertExpectedLocalTreeData()
        })

        it('should delete custom list trees', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()

            const insertAllTestListData = async () => {
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.first)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.second)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.third)
                await setups[0].storageManager
                    .collection('customLists')
                    .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
                await setups[0].storageManager
                    .collection('sharedListMetadata')
                    .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
                await setups[0].storageManager
                    .collection('customListTrees')
                    .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
                await setups[0].storageManager
                    .collection('customListTrees')
                    .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
                await setups[0].storageManager
                    .collection('customListTrees')
                    .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
                await setups[0].storageManager
                    .collection('customListTrees')
                    .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
                // TODO: Add proper support for link target lists
                // await setups[0].storageManager
                //     .collection('customListTrees')
                //     .createObject(LOCAL_TEST_DATA_V24.customListTrees.fifth)
            }

            await insertAllTestListData()

            const customListData = cloneDeep(LOCAL_TEST_DATA_V24.customLists)
            for (const id in customListData) {
                customListData[id].nameTerms = expect.anything()
            }

            expect(
                await setups[0].storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([
                LOCAL_TEST_DATA_V24.customListTrees.first,
                LOCAL_TEST_DATA_V24.customListTrees.second,
                LOCAL_TEST_DATA_V24.customListTrees.third,
                LOCAL_TEST_DATA_V24.customListTrees.fourth,
                // LOCAL_TEST_DATA_V24.customListTrees.fifth,
            ])
            expect(
                await setups[0].storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([
                customListData.first,
                customListData.second,
                customListData.third,
                customListData.fourth,
            ])

            // Delete first list, which is the ancestor of all the others. Thus deleting all lists
            await setups[0].backgroundModules.contentSharing.deleteListAndAllAssociatedData(
                {
                    localListId: LOCAL_TEST_DATA_V24.customLists.first.id,
                },
            )

            expect(
                await setups[0].storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await setups[0].storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([])

            await insertAllTestListData()
            // Delete third list, which should also result in the deletion of the fourth list - its child
            await setups[0].backgroundModules.contentSharing.deleteListAndAllAssociatedData(
                {
                    localListId: LOCAL_TEST_DATA_V24.customLists.third.id,
                },
            )

            expect(
                await setups[0].storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([
                LOCAL_TEST_DATA_V24.customListTrees.first,
                LOCAL_TEST_DATA_V24.customListTrees.second,
                // LOCAL_TEST_DATA_V24.customListTrees.fifth,
            ])
            expect(
                await setups[0].storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([customListData.first, customListData.second])

            await setups[0].backgroundModules.contentSharing.deleteListAndAllAssociatedData(
                {
                    localListId: LOCAL_TEST_DATA_V24.customLists.first.id,
                },
            )
            expect(
                await setups[0].storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await setups[0].storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([])
        })

        it('should create custom list descriptions', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'sharedList',
                    'personalList',
                    'personalListDescription',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.first.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.second.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                sharedList: [],
                personalList: [testLists.first, testLists.second],
                personalListDescription: [testListDescriptions.first, testListDescriptions.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.second },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListDescriptions', object: LOCAL_TEST_DATA_V24.customListDescriptions.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'customListDescriptions', object: LOCAL_TEST_DATA_V24.customListDescriptions.second },
            ], { skip: 0 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create custom list descriptions for a shared list, updating the description field of the server-side shared list record', async () => {
            const {
                setups,
                serverIdCapturer,
                personalDataChanges,
                testDownload,
                getDatabaseContents,
                getPersonalWhere,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListShares = remoteData.personalListShare
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'sharedList',
                    'personalList',
                    'personalListDescription',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                    [DataChangeType.Create, 'personalListShare', testListShares.first.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.first.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.second.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                sharedList: [expect.objectContaining({ description: LOCAL_TEST_DATA_V24.customListDescriptions.first.description })],
                personalList: [testLists.first, testLists.second],
                personalListDescription: [testListDescriptions.first, testListDescriptions.second],
            })
        })

        it('should create custom list descriptions for lists, then share one of them, setting the description field of the server-side shared list record', async () => {
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                getPersonalWhere,
                personalDataChanges,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListShares = remoteData.personalListShare
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'sharedList',
                    'personalList',
                    'personalListDescription',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.first.id],
                    [DataChangeType.Create, 'personalListDescription', testListDescriptions.second.id],
                    [DataChangeType.Create, 'personalListShare', testListShares.first.id],
                ], { skipChanges: 0 }),
                personalBlockStats: [],
                sharedList: [expect.objectContaining({ description: LOCAL_TEST_DATA_V24.customListDescriptions.first.description })],
                personalList: [testLists.first, testLists.second],
                personalListDescription: [testListDescriptions.first, testListDescriptions.second],
            })
        })

        it('should update custom list descriptions', async () => {
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                getPersonalWhere,
                personalDataChanges,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const updatedDescription = 'Updated list description'
            await setups[0].storageManager
                .collection('customListDescriptions')
                .updateOneObject(
                    {
                        listId:
                            LOCAL_TEST_DATA_V24.customListDescriptions.first
                                .listId,
                    },
                    { description: updatedDescription },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListDescription',
                    'sharedList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalListDescription', testListDescriptions.first.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [],
                sharedList: [],
                personalListDescription: [{ ...testListDescriptions.first, description: updatedDescription }, testListDescriptions.second],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'customListDescriptions',
                        object: {
                            listId:
                                LOCAL_TEST_DATA_V24.customListDescriptions.first
                                    .listId,
                            description: updatedDescription,
                        },
                    },
                ],
                { skip: 4 },
            )
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update custom list descriptions for a shared list, updating the description field of the server-side shared list record', async () => {
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                getPersonalWhere,
                personalDataChanges,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const updatedDescription = 'Updated list description'
            await setups[0].storageManager
                .collection('customListDescriptions')
                .updateOneObject(
                    {
                        listId:
                            LOCAL_TEST_DATA_V24.customListDescriptions.first
                                .listId,
                    },
                    { description: updatedDescription },
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents( [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListDescription',
                    'sharedList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalListDescription', testListDescriptions.first.id],
                ], { skipChanges: 5 }),
                personalBlockStats: [],
                personalListDescription: [{ ...testListDescriptions.first, description: updatedDescription }, testListDescriptions.second],
                sharedList: [expect.objectContaining({ description: updatedDescription })],
            })
        })

        it('should delete custom list descriptions', async () => {
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                getPersonalWhere,
                personalDataChanges,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            await setups[0].storageManager
                .collection('customListDescriptions')
                .deleteObjects({})
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testLists = remoteData.personalList
            const testListDescriptions = remoteData.personalListDescription

            // prettier-ignore
            expect(
                await getDatabaseContents( [
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListDescription',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalListDescription', testListDescriptions.first.id, { listId: LOCAL_TEST_DATA_V24.customListDescriptions.first.listId }],
                    [DataChangeType.Delete, 'personalListDescription', testListDescriptions.second.id, { listId: LOCAL_TEST_DATA_V24.customListDescriptions.second.listId }],
                ], { skipChanges: 4 }),
                personalBlockStats: [],
                personalListDescription: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'customListDescriptions', where: { listId: LOCAL_TEST_DATA_V24.customListDescriptions.first.listId } },
                { type: PersonalCloudUpdateType.Delete, collection: 'customListDescriptions', where: { listId: LOCAL_TEST_DATA_V24.customListDescriptions.second.listId } },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create page list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalListEntry', testListEntries.first.id],
                    [DataChangeType.Create, 'personalListEntry', testListEntries.second.id],
                ], { skipChanges: 5 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalListEntry: [testListEntries.first, testListEntries.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.first },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.second },
            ], { skip: 3 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete page list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalListEntry', testListEntries.first.id, changeInfo],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalListEntry: [testListEntries.second],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'pageListEntries', where: changeInfo },
            ], { skip: 4 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create shared list metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete shared list metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create annotation list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalAnnotationListEntry',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationListEntry', testAnnotationListEntries.first.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
                personalAnnotationListEntry: [testAnnotationListEntries.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotListEntries', object: LOCAL_TEST_DATA_V24.annotationListEntries.first },
            ], { skip: 4 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete annotation list entries', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalAnnotationListEntry',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationListEntry', testAnnotationListEntries.first.id, changeInfo],
                ], { skipChanges: 8 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
                personalAnnotationListEntry: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'annotListEntries', where: changeInfo },
            ], { skip: 4 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.second.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationShare', testAnnotationShares.second.id],

                ], { skipChanges: 9 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete shared annotation metadata', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationShare', testAnnotationShares.second.id, changeInfo],
                ], { skipChanges: 9 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.firstPageTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstPageTag.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [testTags.firstPageTag],
                personalTagConnection: [testConnections.firstPageTag],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'tags', object: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should connect existing page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstPageTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.secondPageTag.id],
                ], { skipChanges: 5 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should remove page tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstPageTag.id, LOCAL_TEST_DATA_V24.tags.firstPageTag],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [testConnections.secondPageTag],
                personalTag: [testTags.firstPageTag],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 3 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('final tag removal for page should remove now-orphaned personalTag', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstPageTag.id, LOCAL_TEST_DATA_V24.tags.firstPageTag],
                    [DataChangeType.Delete, 'personalTag', testTags.firstPageTag.id],
                ], { skipChanges: 6 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 2 })],
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [],
                personalTag: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.firstPageTag },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should add annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                ], { skipChanges: 4 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should connect existing annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.firstAnnotationTag.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.secondAnnotationTag.id],
                ], { skipChanges: 7 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should remove annotation tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstAnnotationTag.id, LOCAL_TEST_DATA_V24.tags.firstAnnotationTag],
                ], { skipChanges: 10 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('final tag removal for annotation should remove now-orphaned personalTag', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup()
            testSyncPushTrigger({ wasTriggered: false })
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
                await getDatabaseContents([
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
                ...personalDataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.firstAnnotationTag.id, LOCAL_TEST_DATA_V24.tags.firstAnnotationTag],
                    [DataChangeType.Delete, 'personalTag', testTags.firstAnnotationTag.id],
                ], { skipChanges: 8 }),
                personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete text export template', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should create Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should update Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete Memex extension settings', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorageManager,
                getPersonalWhere,
                personalDataChanges,
                personalBlockStats,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
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
                await getDatabaseContents([
                    // 'dataUsageEntry',
                    'personalDataChange',
                    'personalBlockStats',
                    'personalMemexSetting',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                ...personalDataChanges(remoteData, [
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
            testSyncPushTrigger({ wasTriggered: true })
        })

        // TODO: These are for our old Twitter title fetch feature which has since been replaced with general page title fetching for any page missing a title.
        //  These should be replaced with test coverage for those features.
        describe.skip(`OLD: translation layer twitter integration`, () => {
            it('should trigger twitter action create on creation of twitter status pages with missing titles', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    getDatabaseContents,
                    personalDataChanges,
                    getPersonalWhere,
                    testSyncPushTrigger,
                } = await setup()

                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.twitter_a)
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.twitter_b)
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTwitterActions = remoteData.personalTwitterAction

                // prettier-ignore
                expect(
                    await getDatabaseContents([
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalTwitterAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...personalDataChanges(remoteData, [
                        [DataChangeType.Create, 'personalContentMetadata', testMetadata.twitter_a.id],
                        [DataChangeType.Create, 'personalContentLocator', testLocators.twitter_a.id],
                        [DataChangeType.Create, 'personalContentMetadata', testMetadata.twitter_b.id],
                        [DataChangeType.Create, 'personalContentLocator', testLocators.twitter_b.id],
                    ], { skipAssertTimestamp: true }),
                    personalContentMetadata: [testMetadata.twitter_a, testMetadata.twitter_b],
                    personalContentLocator: [testLocators.twitter_a, testLocators.twitter_b],
                    personalTwitterAction: [testTwitterActions.first, testTwitterActions.second],
                })
            })

            it('should NOT trigger twitter action create on creation of twitter status pages without missing titles', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    getDatabaseContents,
                    personalDataChanges,
                    getPersonalWhere,
                    testSyncPushTrigger,
                } = await setup()

                const testTitleA = 'X on Twitter: "cool stuff"'
                const testTitleB = 'X on Twitter: "more cool stuff"'
                await setups[0].storageManager
                    .collection('pages')
                    .createObject({
                        ...LOCAL_TEST_DATA_V24.pages.twitter_a,
                        fullTitle: testTitleA,
                    })
                await setups[0].storageManager
                    .collection('pages')
                    .createObject({
                        ...LOCAL_TEST_DATA_V24.pages.twitter_b,
                        fullTitle: testTitleB,
                    })
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator

                // prettier-ignore
                expect(
                    await getDatabaseContents( [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalTwitterAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...personalDataChanges(remoteData, [
                        [DataChangeType.Create, 'personalContentMetadata', testMetadata.twitter_a.id],
                        [DataChangeType.Create, 'personalContentLocator', testLocators.twitter_a.id],
                        [DataChangeType.Create, 'personalContentMetadata', testMetadata.twitter_b.id],
                        [DataChangeType.Create, 'personalContentLocator', testLocators.twitter_b.id],
                    ], {  skipAssertTimestamp: true }),
                    personalContentMetadata: [{ ...testMetadata.twitter_a, title: testTitleA }, { ...testMetadata.twitter_b, title: testTitleB }],
                    personalContentLocator: [testLocators.twitter_a, testLocators.twitter_b],
                    personalTwitterAction: [],
                })
            })

            it('should NOT trigger twitter action create on creation of non-status twitter pages', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    getDatabaseContents,
                    personalDataChanges,
                    getPersonalWhere,
                    testSyncPushTrigger,
                } = await setup()

                const url = 'twitter.com/zzzzz'
                await setups[0].storageManager
                    .collection('pages')
                    .createObject({
                        ...LOCAL_TEST_DATA_V24.pages.twitter_a,
                        url,
                        fullUrl: 'https://' + url,
                        canonicalUrl: 'https://' + url,
                    })
                await setups[0].backgroundModules.personalCloud.waitForSync()

                const remoteData = serverIdCapturer.mergeIds(
                    REMOTE_TEST_DATA_V24,
                )
                const testMetadata = remoteData.personalContentMetadata
                const testLocators = remoteData.personalContentLocator
                const testTwitterActions = remoteData.personalTwitterAction

                // prettier-ignore
                expect(
                    await getDatabaseContents( [
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalTwitterAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...personalDataChanges(remoteData, [
                        [DataChangeType.Create, 'personalContentMetadata', testMetadata.twitter_a.id],
                        [DataChangeType.Create, 'personalContentLocator', testLocators.twitter_a.id],
                    ], { skipAssertTimestamp: true }),
                    personalContentMetadata: [{ ...testMetadata.twitter_a, canonicalUrl: 'https://' + url }],
                    personalContentLocator: [{
                        ...testLocators.twitter_a,
                        location: url,
                        originalLocation: 'https://' + url,
                    }],
                    personalTwitterAction: [],
                })
            })
        })

        describe(`translation layer readwise integration`, () => {
            it('should create annotations, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...personalDataChanges(remoteData, [
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should update annotation notes, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
                        // 'dataUsageEntry',
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalAnnotation',
                        'personalAnnotationSelector',
                        'personalReadwiseAction',
                    ], { getWhere: getPersonalWhere }),
                ).toEqual({
                    ...personalDataChanges(remoteData, [
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should add annotation tags, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
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
                    ...personalDataChanges(remoteData, [
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should remove annotation tags, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
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
                    ...personalDataChanges(remoteData, [
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should add annotation spaces, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
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
                    ...personalDataChanges(remoteData, [
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should remove annotation spaces, triggering readwise action create', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                    await getDatabaseContents([
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
                    ...personalDataChanges(remoteData, [
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
                    {
                        type: PersonalCloudUpdateType.Delete, collection: 'annotListEntries', where: {
                            url: LOCAL_TEST_DATA_V24.annotationListEntries.first.url,
                            listId: LOCAL_TEST_DATA_V24.annotationListEntries.first.listId,
                        }
                    },
                ], { skip: 6 })
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should create annotations, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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

                const firstHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )
                const secondHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.second,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )

                testFetches([firstHighlight, secondHighlight])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should update annotation notes, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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

                const highlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )

                testFetches([highlight, { ...highlight, note: updatedComment }])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation tags, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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

                const highlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )
                const highlightWithTags = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [testTags.firstAnnotationTag],
                        lists: [],
                    },
                    'production',
                )

                testFetches([highlight, highlightWithTags])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should remove annotation tags, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                const firstHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [],
                    },
                    'production',
                )
                const firstHighlightWithTags = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [testTags.firstAnnotationTag],
                        lists: [],
                    },
                    'production',
                )
                const secondHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.second,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [],
                    },
                    'production',
                )
                const secondHighlightWithTags = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.second,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [testTags.secondAnnotationTag],
                        lists: [],
                    },
                    'production',
                )

                testFetches([
                    firstHighlight,
                    secondHighlight,
                    firstHighlightWithTags,
                    secondHighlightWithTags,
                    firstHighlight,
                ])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation spaces, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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

                const highlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )
                const highlightWithLists = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [testLists.first],
                    },
                    'production',
                )

                testFetches([highlight, highlightWithLists])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should remove annotation spaces, triggering readwise highlight upload', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                const firstHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [],
                    },
                    'production',
                )
                const firstHighlightWithLists = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [testLists.first],
                    },
                    'production',
                )
                const secondHighlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.second,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [],
                    },
                    'production',
                )
                const secondHighlightWithLists = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.second,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        tags: [],
                        lists: [testLists.first],
                    },
                    'production',
                )

                testFetches([
                    firstHighlight,
                    secondHighlight,
                    firstHighlightWithLists,
                    secondHighlightWithLists,
                    firstHighlight,
                ])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should trigger readwise highlight re-uploads upon annotation tags and spaces adds, substituting hyphens for spaces', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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

                const highlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [],
                    },
                    'production',
                )
                const highlightWithTags = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [],
                        tags: [{ name: testTagWithSpaces }],
                    },
                    'production',
                )
                const highlightWithTagsAndSpaces = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: testMetadata.first,
                        lists: [{ name: testListWithSpaces }],
                        tags: [{ name: testTagWithSpaces }],
                    },
                    'production',
                )

                testFetches([
                    highlight,
                    highlightWithTags,
                    highlightWithTagsAndSpaces,
                ])
                expect(
                    await serverStorageManager
                        .collection('personalReadwiseAction')
                        .findAllObjects({ user: TEST_USER.id }),
                ).toEqual([])
            })

            it('should add annotation to page without title, triggering readwise highlight upload, substituting URL for title', async () => {
                const {
                    setups,
                    serverStorageManager,
                    testFetches,
                    testSyncPushTrigger,
                } = await setup({
                    withStorageHooks: true,
                })
                await insertReadwiseAPIKey(serverStorageManager, TEST_USER.id)
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
                const highlight = cloudDataToReadwiseHighlight(
                    {
                        annotation: testAnnotations.first,
                        selector: testSelectors.first,
                        locator: testLocators.first as any,
                        metadata: titlelessMetadata,
                        tags: [],
                        lists: [],
                    },
                    'production',
                )

                testFetches([highlight])
                expect(
                    await serverStorageManager
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
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    personalBlockStats,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
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
                    { anyId: isFBEmu },
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
                    await getDatabaseContents([
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
                    personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.third_base, testLocators.third],
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
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            fingerprint: testLocators.third.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            // sharedList: testListShares.first.remoteId,
                        },
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                            fingerprint: testLocators.third.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            sharedList: testListShares.first.remoteId,
                        },
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should index a remote PDF page, create a shared annotation, create and share a new list, then add that page to the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    getPersonalWhere,
                    personalBlockStats,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
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
                    { anyId: isFBEmu },
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

                const expectedSharedFingerprint = {
                    id: expect.anything(),
                    creator: TEST_USER.id,
                    normalizedUrl:
                        LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                    fingerprint: testLocators.third.fingerprint,
                    fingerprintScheme: FingerprintSchemeType.PdfV1,
                }
                const expectedSharedLocator = {
                    id: expect.anything(),
                    creator: TEST_USER.id,
                    locationScheme: LocationSchemeType.NormalizedUrlV1,
                    normalizedUrl:
                        LOCAL_TEST_DATA_V24.annotations.third.pageUrl,
                    originalUrl: testLocators.third.originalLocation,
                }

                // prettier-ignore
                expect(
                    await getDatabaseContents([
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
                    personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.third],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.third_base, testLocators.third],
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
                    sharedContentFingerprint: expect.arrayContaining([
                        expectedSharedFingerprint,
                        {
                            ...expectedSharedFingerprint,
                            sharedList: expect.any(String),
                        },
                    ]),
                    sharedContentLocator: expect.arrayContaining([
                        expectedSharedLocator,
                        {
                            ...expectedSharedLocator,
                            sharedList: expect.any(String),
                        },
                    ]),
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
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should index a local PDF page, create a shared annotation, create and share a new list, then add that page to the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    personalBlockStats,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.fourth)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_a)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_uploading)
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

                // Local PDFs should get uploaded
                await setups[0].backgroundModules.pages.storage.updateLocatorStatus(
                    {
                        normalizedUrl:
                            LOCAL_TEST_DATA_V24.locators.fourth_uploading
                                .normalizedUrl,
                        locationScheme: LocationSchemeType.UploadStorage,
                        status: 'uploaded',
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

                testLocators.fourth_base.personalContentMetadata =
                    testMetadata.fourth.id
                testLocators.fourth_a.personalContentMetadata =
                    testMetadata.fourth.id

                // prettier-ignore
                expect(
                    await getDatabaseContents([
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
                    personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.fourth],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.fourth_base, testLocators.fourth_a, testLocators.fourth_c_uploaded],
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
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            // sharedList: testListShares.first.remoteId,
                        },
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            sharedList: testListShares.first.remoteId,
                        },
                    ],
                    sharedContentLocator: [
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            locationScheme: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.locationScheme,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            originalUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.originalLocation,
                            location: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.location,
                            // sharedList: testListShares.first.remoteId,
                        },
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            locationScheme: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.locationScheme,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            originalUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.originalLocation,
                            location: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.location,
                            sharedList: testListShares.first.remoteId,
                        },
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
                ], { skip: 2 })
                testSyncPushTrigger({ wasTriggered: true })
            })

            it('should index a PDF page, create a shared annotation, create a new list, add that page to the list, then share the list', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    personalBlockStats,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
                await insertTestPages(setups[0].storageManager)
                // Create PDF page
                await setups[0].storageManager
                    .collection('pages')
                    .createObject(LOCAL_TEST_DATA_V24.pages.fourth)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_a)
                await setups[0].storageManager
                    .collection('locators')
                    .createObject(LOCAL_TEST_DATA_V24.locators.fourth_uploading)
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

                // Local PDFs should get uploaded
                await setups[0].backgroundModules.pages.storage.updateLocatorStatus(
                    {
                        normalizedUrl:
                            LOCAL_TEST_DATA_V24.locators.fourth_uploading
                                .normalizedUrl,
                        locationScheme: LocationSchemeType.UploadStorage,
                        status: 'uploaded',
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

                testLocators.fourth_base.personalContentMetadata =
                    testMetadata.fourth.id
                testLocators.fourth_a.personalContentMetadata =
                    testMetadata.fourth.id

                // prettier-ignore
                expect(
                    await getDatabaseContents([
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
                    personalBlockStats: [personalBlockStats({ usedBlocks: 4 })],
                    personalContentMetadata: [testMetadata.first, testMetadata.second, testMetadata.fourth],
                    personalContentLocator: [testLocators.first, testLocators.second, testLocators.fourth_base, testLocators.fourth_a, testLocators.fourth_c_uploaded],
                    personalList: [testLists.first],
                    personalListEntry: [testListEntries.third],
                    personalListShare: [testListShares.first],
                    personalAnnotation: [testAnnotations.fifth],
                    personalAnnotationShare: [testAnnotationShares.fifth],
                    personalAnnotationPrivacyLevel: [testPrivacyLevels.fifth],
                    sharedList: [
                        expect.objectContaining({
                            id: testListShares.first.remoteId,
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
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            // sharedList: testListShares.first.remoteId,
                        },
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            fingerprint: testLocators.fourth_a.fingerprint,
                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                            sharedList: testListShares.first.remoteId,
                        },
                    ],
                    sharedContentLocator: [
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            locationScheme: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.locationScheme,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            originalUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.originalLocation,
                            location: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.location,
                            // sharedList: testListShares.first.remoteId,
                        },
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            locationScheme: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.locationScheme,
                            normalizedUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.normalizedUrl,
                            originalUrl: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.originalLocation,
                            location: LOCAL_TEST_DATA_V24.locators.fourth_uploaded.location,
                            sharedList: testListShares.first.remoteId,
                        },
                    ],
                })

                // prettier-ignore
                await testDownload([
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pages', object: LOCAL_TEST_DATA_V24.pages.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_a },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedAnnotationMetadata', object: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.fifth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'customLists', object: LOCAL_TEST_DATA_V24.customLists.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'pageListEntries', object: LOCAL_TEST_DATA_V24.pageListEntries.fourth },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'sharedListMetadata', object: LOCAL_TEST_DATA_V24.sharedListMetadata.first },
                    { type: PersonalCloudUpdateType.Overwrite, collection: 'locators', object: LOCAL_TEST_DATA_V24.locators.fourth_uploaded },
                ], { skip: 2 })
                testSyncPushTrigger({ wasTriggered: true })
            })

            // TODO: Fix
            it.skip('should index a page, create a shared list, create a private annotation, add page to list, then share the annotation', async () => {
                const {
                    setups,
                    serverIdCapturer,
                    serverStorageManager,
                    getPersonalWhere,
                    personalDataChanges,
                    personalBlockStats,
                    getDatabaseContents,
                    testDownload,
                    testSyncPushTrigger,
                } = await setup()
                testSyncPushTrigger({ wasTriggered: false })
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
                    await getDatabaseContents([
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
                    personalBlockStats: [personalBlockStats({ usedBlocks: 3 })],
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
                            color: LOCAL_TEST_DATA_V24.annotations.first.color,
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
                testSyncPushTrigger({ wasTriggered: true })
            })
        })

        it('should create followedList next sync download after following a sharedList', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup({ withStorageHooks: true })
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const serverStorage = setups[0].serverStorage
            await serverStorage.modules.activityFollows.storeFollow({
                collection: 'sharedList',
                userReference: { id: TEST_USER.id, type: 'user-reference' },
                objectId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
            })

            await setups[0].backgroundModules.personalCloud.waitForSync()
            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                // Using the FB emu here results in non-deterministic IDs that get followed
                anyId: isFBEmu,
            })
            const testFollowedLists = remoteData.personalFollowedList

            expect(
                await getDatabaseContents(['personalDataChange'], {
                    getWhere: getPersonalWhere,
                }),
            ).toEqual({
                ...personalDataChanges(
                    remoteData,
                    [
                        [
                            DataChangeType.Create,
                            'personalFollowedList',
                            testFollowedLists.first.id,
                        ],
                    ],
                    {
                        skipChanges: 2,
                        skipAssertDeviceId: true,
                        skipAssertTimestamp: true,
                    },
                ),
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'followedList', object: LOCAL_TEST_DATA_V24.followedList.first },
            ], { skip: 2 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        it('should delete followedList next sync download after unfollowing a sharedList', async () => {
            const {
                setups,
                serverIdCapturer,
                getPersonalWhere,
                personalDataChanges,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
            } = await setup({ withStorageHooks: true })
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const serverStorage = setups[0].serverStorage
            await serverStorage.modules.activityFollows.storeFollow({
                collection: 'sharedList',
                userReference: { id: TEST_USER.id, type: 'user-reference' },
                objectId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await serverStorage.modules.activityFollows.deleteFollow({
                collection: 'sharedList',
                userReference: { id: TEST_USER.id, type: 'user-reference' },
                objectId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24, {
                anyId: isFBEmu,
            })
            const testFollowedLists = remoteData.personalFollowedList

            expect(
                await getDatabaseContents(['personalDataChange'], {
                    getWhere: getPersonalWhere,
                }),
            ).toEqual({
                ...personalDataChanges(
                    remoteData,
                    [
                        [
                            DataChangeType.Create,
                            'personalFollowedList',
                            testFollowedLists.first.id,
                        ],
                        [
                            DataChangeType.Delete,
                            'personalFollowedList',
                            testFollowedLists.first.id,
                            {
                                sharedList:
                                    LOCAL_TEST_DATA_V24.sharedListMetadata.first
                                        .remoteId,
                            },
                        ],
                    ],
                    {
                        skipChanges: 2,
                        skipAssertDeviceId: true,
                        skipAssertTimestamp: true,
                    },
                ),
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'followedList', where: { sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId } },
            ], { skip: 3 })
            testSyncPushTrigger({ wasTriggered: true })
        })

        // TODO: Fix
        it.skip('should remove every trace of a list and associated data on local delete', async () => {
            const TEST_USER_2_ID = 'another-user@test.com'
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
                personalDataChanges,
            } = await setup({
                withStorageHooks: true,
                deviceUsers: [TEST_USER.email, TEST_USER_2_ID],
            })
            await setups[0].backgroundModules.auth.options.userManagement.ensureUser(
                { displayName: TEST_USER.displayName },
                {
                    type: 'user-reference',
                    id: TEST_USER.id,
                },
            )
            await setups[0].backgroundModules.auth.options.userManagement.ensureUser(
                { displayName: TEST_USER_2_ID },
                {
                    type: 'user-reference',
                    id: TEST_USER_2_ID,
                },
            )

            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
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
            await setups[0].storageManager
                .collection('annotListEntries')
                .createObject(LOCAL_TEST_DATA_V24.annotationListEntries.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // Create key from owner then join with other device/user
            const sharedListKeyId = isFBEmu ? 'my-test-key' : 123
            await setups[0].services.contentSharing.generateKeyLink({
                key: { roleID: SharedListRoleID.ReadWrite },
                listKeyReference: {
                    type: 'shared-list-key-reference',
                    id: sharedListKeyId,
                },
                listReference: {
                    type: 'shared-list-reference',
                    id: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                },
            })
            await setups[1].backgroundModules.contentSharing.options.backend.processListKey(
                {
                    keyString: sharedListKeyId as any,
                    listId:
                        LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                },
            )

            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Add an annot to the shared list on the second user's device
            const annotBId = '11111112'
            const annotBUrl =
                LOCAL_TEST_DATA_V24.pages.first.url + '/#' + annotBId
            const syncedPersonalList: {
                id: AutoPk
                localId: AutoPk
            } = await setups[1].serverStorage.manager
                .collection('personalList')
                .findObject({
                    user: TEST_USER_2_ID,
                })
            const syncedListTree: {
                id: AutoPk
                localId: AutoPk
            } = await setups[1].serverStorage.manager
                .collection('personalListTree')
                .findObject({
                    user: TEST_USER_2_ID,
                })

            await setups[1].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
            await setups[1].storageManager
                .collection('pageListEntries')
                .createObject({
                    ...LOCAL_TEST_DATA_V24.pageListEntries.first,
                    listId: syncedPersonalList.localId,
                })
            await setups[1].storageManager
                .collection('annotations')
                .createObject({
                    ...LOCAL_TEST_DATA_V24.annotations.first,
                    url: annotBUrl,
                })
            await setups[1].storageManager
                .collection('sharedAnnotationMetadata')
                .createObject({
                    ...LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first,
                    localId: annotBUrl,
                })
            await setups[1].storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first,
                    annotation: annotBUrl,
                })
            await setups[1].storageManager
                .collection('annotListEntries')
                .createObject({
                    ...LOCAL_TEST_DATA_V24.annotationListEntries.first,
                    url: annotBUrl,
                    listId: syncedPersonalList.localId,
                })

            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert shared* cloud data, pre-delete
            // prettier-ignore
            const sharedData = await getDatabaseContents(
                [
                    'sharedListRole',
                    'sharedListRoleByUser',
                    'sharedListEntry',
                    'sharedAnnotation',
                    'sharedAnnotationListEntry',
                    'sharedListKey',
                    'sharedList',
                    'sharedListTree',
                ], { getWhere: coll => {
                    // These are grouped collections, so they need to have their grouped fields defined in the queries
                    if (coll === 'sharedListRole' || coll === 'sharedListKey') {
                        return { sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId }
                    }
                    if (coll === 'sharedListRoleByUser') {
                        return { user: TEST_USER_2_ID }
                    }
                    return {}
                } }
            )
            const [sharedListTree] = sharedData.sharedListTree as [
                SharedListTree,
            ]

            // prettier-ignore
            expect(sharedData).toEqual({
                sharedListRole: expect.arrayContaining([
                    expect.objectContaining({
                        roleID: SharedListRoleID.Owner,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER.id,
                    }),
                    expect.objectContaining({
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER_2_ID,
                    }),
                ]),
                sharedListRoleByUser: [
                    // Exclude owner's, not because it doesn't exist, but because too painful to update getWhere to support multi-ID queries on grouped coll
                    // expect.objectContaining({
                    //     roleID: SharedListRoleID.Owner,
                    //     sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    //     user: TEST_USER.id,
                    // }),
                    expect.objectContaining({
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER_2_ID,
                    }),
                ],
                sharedListEntry: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        normalizedUrl: LOCAL_TEST_DATA_V24.pageListEntries.first.pageUrl
                    }),
                ],
                sharedListKey: [
                    expect.objectContaining({
                        disabled: false,
                        id: sharedListKeyId,
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    }),
                ],
                sharedList: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        description: LOCAL_TEST_DATA_V24.customListDescriptions.first.description,
                    }),
                ],
                sharedListTree: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    }),
                ],
                sharedAnnotation: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
                sharedAnnotationListEntry: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        sharedAnnotation: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
            })

            // Assert user A (list owner)'s sync data, pre-delete
            const remoteDataA = serverIdCapturer.mergeIds(
                REMOTE_TEST_DATA_V24,
                {
                    userOverride: TEST_USER.id,
                    anyId: isFBEmu,
                },
            )
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER.id }
                        }
                    },
                }),
            ).toEqual({
                personalList: [remoteDataA.personalList.first],
                personalListDescription: [remoteDataA.personalListDescription.first],
                personalListTree: [
                    {
                        ...omit(remoteDataA.personalListTree.first, isFBEmu ? ['linkTarget'] : []),
                        id: remoteDataA.personalList.first.localId,
                    },
                ],
                personalListShare: [remoteDataA.personalListShare.first],
                personalListEntry: [remoteDataA.personalListEntry.first],
                personalAnnotationListEntry: [remoteDataA.personalAnnotationListEntry.first],
                personalAnnotation: [remoteDataA.personalAnnotation.first],
                personalFollowedList: [
                    {
                        ...omit(remoteDataA.personalFollowedList.first, ['createdByDevice']),
                        id: expect.anything(),
                    },
                ],
            })

            // Assert user B (list joiner)'s sync data, pre-delete
            const remoteDataB = serverIdCapturer.mergeIds(
                REMOTE_TEST_DATA_V24,
                {
                    userOverride: TEST_USER_2_ID,
                    deviceOverride: 2,
                    anyId: true,
                },
            )
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER_2_ID }
                        }
                    },
                }),
            ).toEqual({
                personalList: [{
                    ...remoteDataB.personalList.first,
                    localId: syncedPersonalList.localId,
                    createdByDevice: undefined, // This is created via a storage hook, thus no device
                }],
                personalListDescription: [],
                personalListTree: [{
                    id: expect.anything(),
                    parentListId: ROOT_NODE_PARENT_ID,
                    localParentListId: ROOT_NODE_PARENT_ID,
                    order: sharedListTree.order,
                    // localLinkTarget: null,
                    // linkTarget: null,
                    // localPath: null,
                    // path: null,
                    localId: syncedListTree.localId,
                    personalList: syncedPersonalList.id,
                    localListId: syncedPersonalList.localId,
                    updatedWhen: expect.anything(),
                    createdWhen: expect.anything(),
                    user: TEST_USER_2_ID,
                    createdByDevice: undefined, // This is created via a storage hook, thus no device
                }],
                personalListShare: [{
                    ...remoteDataB.personalListShare.first,
                    personalList: syncedPersonalList.id,
                    createdByDevice: undefined, // This is created via a storage hook, thus no device
                }],
                personalListEntry: [{
                    ...remoteDataB.personalListEntry.first,
                    personalContentMetadata: expect.anything(),
                    personalList: syncedPersonalList.id
                }],
                personalAnnotationListEntry: [{
                    ...remoteDataB.personalAnnotationListEntry.first,
                    personalAnnotation: expect.anything(),
                    personalList: syncedPersonalList.id
                }],
                personalAnnotation: [{
                    ...remoteDataB.personalAnnotation.first,
                    localId: annotBId,
                    personalContentMetadata: expect.anything()
                }],
                personalFollowedList: [
                    {
                        ...remoteDataB.personalFollowedList.first,
                        createdByDevice: undefined, // This is created via a storage hook, thus no device
                        id: expect.anything(),
                    },
                ],
            })

            // Perform the list delete on the first device (owner)
            // TODO: This doesn't work on the FB emu for some reason. It throws a FB error when
            //  deleting the `customLists` record in CustomListsBG (which should happen on the Dexie backend).
            await setups[0].backgroundModules.contentSharing.deleteListAndAllAssociatedData(
                { localListId: LOCAL_TEST_DATA_V24.customLists.first.id },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert shared* cloud data, post-delete
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'sharedListRole',
                    'sharedListRoleByUser',
                    'sharedListEntry',
                    'sharedAnnotation',
                    'sharedAnnotationListEntry',
                    'sharedListKey',
                    'sharedList',
                    'sharedListTree',
                ], { getWhere: coll => {
                    // These are grouped collections, so they need to have their grouped fields defined in the queries
                    if (coll === 'sharedListRole' || coll === 'sharedListKey') {
                        return { sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId }
                    }
                    if (coll === 'sharedListRoleByUser') {
                        return { user: TEST_USER_2_ID }
                    }
                    return {}
                } }),
            ).toEqual({
                sharedListRole: [],
                sharedListRoleByUser: [],
                sharedListEntry: [],
                sharedListKey: [],
                sharedList: [],
                sharedListTree: [],
                sharedAnnotation: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
                sharedAnnotationListEntry: [],
            })

            // Assert user A (list owner)'s list data has been deleted
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalDataChange',
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER.id }
                        }
                    },
                }),
            ).toEqual({
                ...personalDataChanges(remoteDataB, [
                    // followedList added via follow storage hook (on list join)
                    [DataChangeType.Create, 'personalFollowedList', expect.any(isFBEmu ? String : Number), undefined, { createdByDevice: undefined }],
                    [DataChangeType.ListTreeDelete, 'personalList', remoteDataA.personalList.first.id, {
                        localListId: remoteDataA.personalList.first.localId,
                    }],
                ], { skipChanges: 12, skipAssertTimestamp: true }),
                personalList: [],
                personalListDescription: [],
                personalListTree: [],
                personalListShare: [],
                personalListEntry: [],
                personalAnnotationListEntry: [],
                personalAnnotation: [remoteDataA.personalAnnotation.first],
                personalFollowedList: [],
            })

            // prettier-ignore
            await testDownload([
                // Before this comes the 4 docs related to the annotation (page+annotation+annotShare+annotPrivacyLvl)
                {
                    type: PersonalCloudUpdateType.ListTreeDelete,
                    rootNodeLocalListId:
                        LOCAL_TEST_DATA_V24.customLists.first.id,
                },
            ], { skip: 4, deviceIndex: 1, userId: TEST_USER.id, queryResultLimit: 1000 })

            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert user B (list joiner)'s list data has also been deleted
            // TODO: This will come later - for now we don't care about deleting collab users data
            // prettier-ignore
            // expect(
            //     await getDatabaseContents([
            //         'personalList',
            //         'personalListDescription',
            //         'personalListTree',
            //         'personalListShare',
            //         'personalFollowedList',
            //         'personalListEntry',
            //         'personalAnnotationListEntry',
            //         'personalAnnotation',
            //     ], {
            //         getWhere: (collection) => {
            //             if (collection.startsWith('personal')) {
            //                 return { user: TEST_USER_2_ID }
            //             }
            //         },
            //     }),
            // ).toEqual({
            //     personalList: [],
            //     personalListDescription: [],
            //     personalListTree: [],
            //     personalListShare: [],
            //     personalListEntry: [],
            //     personalAnnotationListEntry: [],
            //     personalAnnotation: [{
            //         ...remoteDataB.personalAnnotation.first,
            //         localId: annotBId,
            //         personalContentMetadata: expect.anything()
            //     }],
            //     personalFollowedList: [],
            // })

            // For now, as we're not deleting collab users data, they are just expected to DL the list data which
            //  happens after they join the list.
            // prettier-ignore
            await testDownload([
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'customLists',
                    object: {
                        id: syncedPersonalList.localId,
                        createdAt: expect.anything(),
                        isDeletable: true,
                        isNestable: true,
                        name: LOCAL_TEST_DATA_V24.customLists.first.name,
                        searchableName: LOCAL_TEST_DATA_V24.customLists.first.name,
                    },
                },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'customListTrees',
                    object: {
                        id: expect.anything(),
                        listId: syncedPersonalList.localId,
                        order: sharedListTree.order,
                        parentListId: ROOT_NODE_PARENT_ID,
                        path: null,
                        linkTarget: null,
                        createdWhen: expect.anything(),
                        updatedWhen: expect.anything(),
                    },
                },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'sharedListMetadata',
                    object: {
                        localId: syncedPersonalList.localId,
                        remoteId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        private: LOCAL_TEST_DATA_V24.sharedListMetadata.first.private,
                    },
                },
            ], { skip: 0, deviceIndex: 1, userId: TEST_USER_2_ID, queryResultLimit: 1000 })

            testSyncPushTrigger({ wasTriggered: true })
        })

        // TODO: Fix
        it.skip('should remove every trace of a tree of lists and associated data on local delete', async () => {
            const TEST_USER_2_ID = 'another-user@test.com'
            const {
                setups,
                serverIdCapturer,
                getDatabaseContents,
                testDownload,
                testSyncPushTrigger,
                personalDataChanges,
            } = await setup({
                withStorageHooks: true,
                deviceUsers: [TEST_USER.email, TEST_USER_2_ID],
            })
            await setups[0].backgroundModules.auth.options.userManagement.ensureUser(
                { displayName: TEST_USER.displayName },
                {
                    type: 'user-reference',
                    id: TEST_USER.id,
                },
            )
            await setups[0].backgroundModules.auth.options.userManagement.ensureUser(
                { displayName: TEST_USER_2_ID },
                {
                    type: 'user-reference',
                    id: TEST_USER_2_ID,
                },
            )

            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.first)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.first)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.first)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.second)
            await setups[0].storageManager
                .collection('customListDescriptions')
                .createObject(LOCAL_TEST_DATA_V24.customListDescriptions.second)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.second)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.third)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.third)
            await setups[0].storageManager
                .collection('customLists')
                .createObject(LOCAL_TEST_DATA_V24.customLists.fourth)
            await setups[0].storageManager
                .collection('sharedListMetadata')
                .createObject(LOCAL_TEST_DATA_V24.sharedListMetadata.fourth)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.first)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.second)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.third)
            await setups[0].storageManager
                .collection('customListTrees')
                .createObject(LOCAL_TEST_DATA_V24.customListTrees.fourth)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.second)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.first)
            await setups[0].storageManager
                .collection('pageListEntries')
                .createObject(LOCAL_TEST_DATA_V24.pageListEntries.fifth)
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
            await setups[0].storageManager
                .collection('annotListEntries')
                .createObject(LOCAL_TEST_DATA_V24.annotationListEntries.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            // Create key from owner then join with other device/user
            const sharedListKeyId = isFBEmu ? 'my-test-key' : 123
            await setups[0].services.contentSharing.generateKeyLink({
                key: { roleID: SharedListRoleID.ReadWrite },
                listKeyReference: {
                    type: 'shared-list-key-reference',
                    id: sharedListKeyId,
                },
                listReference: {
                    type: 'shared-list-reference',
                    id: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                },
            })
            await setups[1].backgroundModules.contentSharing.options.backend.processListKey(
                {
                    keyString: sharedListKeyId as any,
                    listId:
                        LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                },
            )

            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert shared* cloud data, pre-delete
            // prettier-ignore
            const sharedData = await getDatabaseContents(
                [
                    'sharedListRole',
                    'sharedListRoleByUser',
                    'sharedListEntry',
                    'sharedAnnotation',
                    'sharedAnnotationListEntry',
                    'sharedListKey',
                    'sharedList',
                    'sharedListTree',
                ], { getWhere: coll => {
                    // These are grouped collections, so they need to have their grouped fields defined in the queries
                    if (coll === 'sharedListRole' || coll === 'sharedListKey') {
                        return { sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId }
                    }
                    if (coll === 'sharedListRoleByUser') {
                        return { user: TEST_USER_2_ID }
                    }
                    return {}
                } }
            )
            const sharedListTrees = sharedData.sharedListTree as SharedListTree[]

            // prettier-ignore
            expect(sharedData).toEqual({
                sharedListRole: expect.arrayContaining([
                    expect.objectContaining({
                        roleID: SharedListRoleID.Owner,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER.id,
                    }),
                    expect.objectContaining({
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER_2_ID,
                    }),
                ]),
                sharedListRoleByUser: [
                    // Exclude owner's, not because it doesn't exist, but because too painful to update getWhere to support multi-ID queries on grouped coll
                    // expect.objectContaining({
                    //     roleID: SharedListRoleID.Owner,
                    //     sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    //     user: TEST_USER.id,
                    // }),
                    expect.objectContaining({
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        user: TEST_USER_2_ID,
                    }),
                ],
                sharedListEntry: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        normalizedUrl: LOCAL_TEST_DATA_V24.pageListEntries.first.pageUrl,
                        creator: TEST_USER.id,
                    }),
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.second.remoteId,
                        normalizedUrl: LOCAL_TEST_DATA_V24.pageListEntries.second.pageUrl,
                        creator: TEST_USER.id,
                    }),
                ],
                sharedListKey: [
                    expect.objectContaining({
                        disabled: false,
                        id: sharedListKeyId,
                        roleID: SharedListRoleID.ReadWrite,
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    }),
                ],
                sharedList: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        title: LOCAL_TEST_DATA_V24.customLists.first.name,
                        description: LOCAL_TEST_DATA_V24.customListDescriptions.first.description,
                    }),
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedListMetadata.second.remoteId,
                        title: LOCAL_TEST_DATA_V24.customLists.second.name,
                        description: LOCAL_TEST_DATA_V24.customListDescriptions.second.description,
                    }),
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedListMetadata.third.remoteId,
                        title: LOCAL_TEST_DATA_V24.customLists.third.name,
                    }),
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedListMetadata.fourth.remoteId,
                        title: LOCAL_TEST_DATA_V24.customLists.fourth.name,
                    }),
                ],
                sharedListTree: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                    }),
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.second.remoteId,
                    }),
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.third.remoteId,
                    }),
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.fourth.remoteId,
                    }),
                ],
                sharedAnnotation: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
                sharedAnnotationListEntry: [
                    expect.objectContaining({
                        sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        sharedAnnotation: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
            })

            // Assert user A (list owner)'s sync data, pre-delete
            const remoteDataA = serverIdCapturer.mergeIds(
                REMOTE_TEST_DATA_V24,
                {
                    userOverride: TEST_USER.id,
                    anyId: isFBEmu,
                },
            )
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER.id }
                        }
                    },
                }),
            ).toEqual({
                personalList: [
                    remoteDataA.personalList.first,
                    remoteDataA.personalList.second,
                    remoteDataA.personalList.third,
                    remoteDataA.personalList.fourth,
                ],
                personalListDescription: [
                    remoteDataA.personalListDescription.first,
                    remoteDataA.personalListDescription.second,
                ],
                personalListTree: [
                    { ...omit(remoteDataA.personalListTree.first, isFBEmu ? ['linkTarget'] : []) },
                    { ...omit(remoteDataA.personalListTree.second, isFBEmu ? ['linkTarget'] : []), path: expect.any(String) },
                    { ...omit(remoteDataA.personalListTree.third, isFBEmu ? ['linkTarget'] : []), path: expect.any(String) },
                    { ...omit(remoteDataA.personalListTree.fourth, isFBEmu ? ['linkTarget'] : []), path: expect.any(String) },
                ],
                personalListShare: [
                    remoteDataA.personalListShare.first,
                    remoteDataA.personalListShare.second,
                    remoteDataA.personalListShare.third,
                    remoteDataA.personalListShare.fourth,
                ],
                personalListEntry: [
                    remoteDataA.personalListEntry.first,
                    { ...remoteDataA.personalListEntry.fifth, id: expect.anything() },
                ],
                personalAnnotationListEntry: [remoteDataA.personalAnnotationListEntry.first],
                personalAnnotation: [remoteDataA.personalAnnotation.first],
                personalFollowedList: [
                    {
                        ...omit(remoteDataA.personalFollowedList.first, ['createdByDevice']),
                        id: expect.anything(),
                    },
                ],
            })

            const syncedPersonalLists: Array<{
                id: AutoPk
                localId: AutoPk
            }> = await setups[1].serverStorage.manager
                .collection('personalList')
                .findObjects({
                    user: TEST_USER_2_ID,
                })
            const syncedListTrees: Array<{
                id: AutoPk
                localId: AutoPk
            }> = await setups[1].serverStorage.manager
                .collection('personalListTree')
                .findObjects({
                    user: TEST_USER_2_ID,
                })

            // Assert user B (list joiner)'s sync data, pre-delete
            const remoteDataB = serverIdCapturer.mergeIds(
                REMOTE_TEST_DATA_V24,
                {
                    userOverride: TEST_USER_2_ID,
                    deviceOverride: 2,
                    anyId: true,
                },
            )
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER_2_ID }
                        }
                    },
                }),
            ).toEqual({
                personalList: [
                    {
                        ...remoteDataB.personalList.first,
                        localId: syncedPersonalLists[0].localId,
                        createdByDevice: undefined, // This is created via a storage hook, thus no device
                    },
                    // TODO: Expected data after tree join support
                    // {
                    //     ...remoteDataB.personalList.second,
                    //     localId: syncedPersonalLists[1].localId,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     ...remoteDataB.personalList.third,
                    //     localId: syncedPersonalLists[2].localId,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     ...remoteDataB.personalList.fourth,
                    //     localId: syncedPersonalLists[3].localId,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                ],
                personalListDescription: [],
                personalListTree: [
                    {
                        id: syncedListTrees[0].id,
                        parentListId: ROOT_NODE_PARENT_ID,
                        localParentListId: ROOT_NODE_PARENT_ID,
                        order: sharedListTrees[0].order,
                        // localLinkTarget: null,
                        // linkTarget: null,
                        // localPath: null,
                        // path: null,
                        localId: syncedListTrees[0].localId,
                        personalList: syncedPersonalLists[0].id,
                        localListId: syncedPersonalLists[0].localId,
                        updatedWhen: expect.anything(),
                        createdWhen: expect.anything(),
                        user: TEST_USER_2_ID,
                        createdByDevice: undefined, // This is created via a storage hook, thus no device
                    },
                    // TODO: Expected data after tree join support
                    // {
                    //     id: syncedListTrees[1].id,
                    //     parentListId: syncedPersonalLists[0].id,
                    //     localParentListId: syncedListTrees[0].id,
                    //     order: sharedListTrees[1].order,
                    //     // localLinkTarget: null,
                    //     // linkTarget: null,
                    //     // localPath: null,
                    //     // path: null,
                    //     localId: syncedListTrees[1].localId,
                    //     personalList: syncedPersonalLists[1].id,
                    //     localListId: syncedPersonalLists[1].localId,
                    //     updatedWhen: expect.anything(),
                    //     createdWhen: expect.anything(),
                    //     user: TEST_USER_2_ID,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     id: syncedListTrees[2].id,
                    //     parentListId: syncedPersonalLists[0].id,
                    //     localParentListId: syncedListTrees[0].id,
                    //     order: sharedListTrees[2].order,
                    //     // localLinkTarget: null,
                    //     // linkTarget: null,
                    //     // localPath: null,
                    //     // path: null,
                    //     localId: syncedListTrees[2].localId,
                    //     personalList: syncedPersonalLists[2].id,
                    //     localListId: syncedPersonalLists[2].localId,
                    //     updatedWhen: expect.anything(),
                    //     createdWhen: expect.anything(),
                    //     user: TEST_USER_2_ID,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     id: syncedListTrees[3].id,
                    //     parentListId: syncedPersonalLists[2].id,
                    //     localParentListId: syncedListTrees[2].id,
                    //     order: sharedListTrees[3].order,
                    //     // localLinkTarget: null,
                    //     // linkTarget: null,
                    //     // localPath: null,
                    //     // path: null,
                    //     localId: syncedListTrees[3].localId,
                    //     personalList: syncedPersonalLists[3].id,
                    //     localListId: syncedPersonalLists[3].localId,
                    //     updatedWhen: expect.anything(),
                    //     createdWhen: expect.anything(),
                    //     user: TEST_USER_2_ID,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                ],
                personalListShare: [
                    {
                        ...remoteDataB.personalListShare.first,
                        personalList: syncedPersonalLists[0].id,
                        createdByDevice: undefined, // This is created via a storage hook, thus no device
                    },
                    // TODO: Expected data after tree join support
                    // {
                    //     ...remoteDataB.personalListShare.second,
                    //     personalList: syncedPersonalLists[1].id,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     ...remoteDataB.personalListShare.third,
                    //     personalList: syncedPersonalLists[2].id,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                    // {
                    //     ...remoteDataB.personalListShare.fourth,
                    //     personalList: syncedPersonalLists[3].id,
                    //     createdByDevice: undefined, // This is created via a storage hook, thus no device
                    // },
                ],
                personalListEntry: [],
                personalAnnotationListEntry: [],
                personalAnnotation: [],
                personalFollowedList: [
                    {
                        ...remoteDataB.personalFollowedList.first,
                        createdByDevice: undefined, // This is created via a storage hook, thus no device
                        id: expect.anything(),
                    },
                ],
            })

            // Perform the list delete on the first device (owner)
            // TODO: This doesn't work on the FB emu for some reason. It throws a FB error when
            //  deleting the `customLists` record in CustomListsBG (which should happen on the Dexie backend).
            await setups[0].backgroundModules.contentSharing.deleteListAndAllAssociatedData(
                { localListId: LOCAL_TEST_DATA_V24.customLists.first.id },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert shared* cloud data, post-delete
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'sharedListRole',
                    'sharedListRoleByUser',
                    'sharedListEntry',
                    'sharedAnnotation',
                    'sharedAnnotationListEntry',
                    'sharedListKey',
                    'sharedList',
                    'sharedListTree',
                ], { getWhere: coll => {
                    // These are grouped collections, so they need to have their grouped fields defined in the queries
                    if (coll === 'sharedListRole' || coll === 'sharedListKey') {
                        return { sharedList: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId }
                    }
                    if (coll === 'sharedListRoleByUser') {
                        return { user: TEST_USER_2_ID }
                    }
                    return {}
                } }),
            ).toEqual({
                sharedListRole: [],
                sharedListRoleByUser: [],
                sharedListEntry: [],
                sharedListKey: [],
                sharedList: [],
                sharedListTree: [],
                sharedAnnotation: [
                    expect.objectContaining({
                        id: LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
                        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
                        normalizedPageUrl: LOCAL_TEST_DATA_V24.annotations.first.pageUrl,
                    }),
                ],
                sharedAnnotationListEntry: [],
            })

            // Assert user A (list owner)'s list data has been deleted
            // prettier-ignore
            expect(
                await getDatabaseContents([
                    'personalDataChange',
                    'personalList',
                    'personalListDescription',
                    'personalListTree',
                    'personalListShare',
                    'personalFollowedList',
                    'personalListEntry',
                    'personalAnnotationListEntry',
                    'personalAnnotation',
                ], {
                    getWhere: (collection) => {
                        if (collection.startsWith('personal')) {
                            return { user: TEST_USER.id }
                        }
                    },
                }),
            ).toEqual({
                ...personalDataChanges(remoteDataB, [
                    // followedList added via follow storage hook (on list join)
                    [DataChangeType.Create, 'personalFollowedList', expect.any(isFBEmu ? String : Number), undefined, { createdByDevice: undefined }],
                    [DataChangeType.ListTreeDelete, 'personalList', remoteDataA.personalList.first.id, {
                        localListId: remoteDataA.personalList.first.localId,
                    }],
                ], { skipChanges: 25, skipAssertTimestamp: true }),
                personalList: [],
                personalListDescription: [],
                personalListTree: [],
                personalListShare: [],
                personalListEntry: [],
                personalAnnotationListEntry: [],
                personalAnnotation: [remoteDataA.personalAnnotation.first],
                personalFollowedList: [],
            })

            // prettier-ignore
            await testDownload([
                // Before this comes the 4 docs related to the annotation (page+annotation+annotShare+annotPrivacyLvl)
                {
                    type: PersonalCloudUpdateType.ListTreeDelete,
                    rootNodeLocalListId:
                        LOCAL_TEST_DATA_V24.customLists.first.id,
                },
            ], { skip: 5, deviceIndex: 1, userId: TEST_USER.id, queryResultLimit: 1000 })

            await setups[1].backgroundModules.personalCloud.waitForSync()

            // Assert user B (list joiner)'s list data has also been deleted
            // TODO: This will come later - for now we don't care about deleting collab users data
            // prettier-ignore
            // expect(
            //     await getDatabaseContents([
            //         'personalList',
            //         'personalListDescription',
            //         'personalListTree',
            //         'personalListShare',
            //         'personalFollowedList',
            //         'personalListEntry',
            //         'personalAnnotationListEntry',
            //         'personalAnnotation',
            //     ], {
            //         getWhere: (collection) => {
            //             if (collection.startsWith('personal')) {
            //                 return { user: TEST_USER_2_ID }
            //             }
            //         },
            //     }),
            // ).toEqual({
            //     personalList: [],
            //     personalListDescription: [],
            //     personalListTree: [],
            //     personalListShare: [],
            //     personalListEntry: [],
            //     personalAnnotationListEntry: [],
            //     personalAnnotation: [{
            //         ...remoteDataB.personalAnnotation.first,
            //         localId: annotBId,
            //         personalContentMetadata: expect.anything()
            //     }],
            //     personalFollowedList: [],
            // })

            // For now, as we're not deleting collab users data, they are just expected to DL the list data which
            //  happens after they join the list.
            // prettier-ignore
            await testDownload([
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'customLists',
                    object: {
                        id: syncedPersonalLists[0].localId,
                        createdAt: expect.anything(),
                        isDeletable: true,
                        isNestable: true,
                        name: LOCAL_TEST_DATA_V24.customLists.first.name,
                        searchableName: LOCAL_TEST_DATA_V24.customLists.first.name,
                    },
                },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'customListTrees',
                    object: {
                        id: expect.anything(),
                        listId: syncedPersonalLists[0].localId,
                        order: sharedListTrees[0].order,
                        parentListId: ROOT_NODE_PARENT_ID,
                        path: null,
                        linkTarget: null,
                        createdWhen: expect.anything(),
                        updatedWhen: expect.anything(),
                    },
                },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'sharedListMetadata',
                    object: {
                        localId: syncedPersonalLists[0].localId,
                        remoteId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
                        private: LOCAL_TEST_DATA_V24.sharedListMetadata.first.private,
                    },
                },
            ], { skip: 0, deviceIndex: 1, userId: TEST_USER_2_ID, queryResultLimit: 1000 })

            testSyncPushTrigger({ wasTriggered: true })
        })
    })
})
