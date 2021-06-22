import StorageManager, {
    isChildOfRelationship,
    getChildOfRelationshipTarget,
} from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { setupSyncBackgroundTest } from '../../index.tests'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
    insertTestPages,
} from './index.test.data'
import { DataChangeType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    PersonalCloudUpdateBatch,
    PersonalCloudUpdateType,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { downloadClientUpdates } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer'
import { STORAGE_VERSIONS } from 'src/storage/constants'

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

    mergeIds<TestData>(testData: TestData) {
        const source = testData as any
        const merged = {} as any
        for (const [collection, objects] of Object.entries(source)) {
            const mergedObjects = (merged[collection] = {})
            merged[collection] = mergedObjects

            let idsPicked = 0
            for (const [objectName, object] of Object.entries(objects)) {
                // pick IDs by looking at the IDs that were generated during object creation
                const nextIdIndex = idsPicked++
                const id = this.ids[collection]?.[nextIdIndex]

                // TODO: determine whether current obj actually written to DB or not - skip if not
                // if (!this.ids[collection]?.includes(object.id)) {
                //     console.log('skippping this:', collection, object)
                //     continue
                // }

                const mergedObject = {
                    ...object,
                    id: id ?? object.id,
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
            contents[collection] = await storageManager
                .collection(collection)
                .findObjects(options?.getWhere?.(collection) ?? {}, {
                    order: [['createdWhen', 'asc']],
                })
        }),
    )
    return contents
}

function getPersonalWhere(collection: string) {
    if (collection.startsWith('personal')) {
        return { user: TEST_USER.id }
    }
}

function dataChanges(
    remoteData: typeof REMOTE_TEST_DATA_V24,
    changes: Array<
        [
            /* type: */ DataChangeType,
            /* collection: */ string,
            /* id: */ string | number,
            /* info: */ any?,
        ]
    >,
    options?: { skip?: number },
) {
    let now = 554
    const advance = () => {
        ++now
    }
    const skip = options?.skip ?? 0
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
                createdWhen: now,
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

describe('Personal cloud translation layer', () => {
    describe(`from local schema version 24`, () => {
        async function setup() {
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
            const {
                setups,
                serverStorage,
                getNow,
            } = await setupSyncBackgroundTest({
                deviceCount: 2,
                serverChangeWatchSettings: {
                    shouldWatchCollection: (collection) => {
                        return collection.startsWith('personal')
                    },
                    postprocessOperation:
                        serverIdCapturer.handlePostStorageChange,
                },
            })
            serverIdCapturer.setup(serverStorage.storageManager)
            return {
                serverIdCapturer,
                setups,
                serverStorage,
                testDownload: async (
                    expected: PersonalCloudUpdateBatch,
                    options?: { skip?: number },
                ) => {
                    const { batch } = await downloadClientUpdates({
                        getNow,
                        startTime: 0,
                        storageManager: serverStorage.storageManager,
                        userId: TEST_USER.id,
                        clientSchemaVersion: STORAGE_VERSIONS[24].version,
                    })
                    expect(batch.slice(options?.skip ?? 0)).toEqual(expected)
                },
            }
        }

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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                ]),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentMetadata', testMetadata.first.id],
                ], { skip: 4 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.first.id, {
                        normalizedUrl: testLocators.first.location
                    }],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.second],
                personalContentLocator: [testLocators.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'pages', where: { url: LOCAL_TEST_DATA_V24.pages.first.url } },
            ], { skip: 1 })
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalContentRead', testReads.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalContentRead: [testReads.first],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'visits', object: LOCAL_TEST_DATA_V24.visits.first },
            ], { skip: 2 })
        })

        it('should update vists', async () => {
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalContentRead', testReads.first.id],
                ], { skip: 5 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalContentRead: [{
                    ...testReads.first,
                    updatedWhen: expect.any(Number),
                    readDuration: updatedDuration,
                }],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'visits', object: {
                    ...LOCAL_TEST_DATA_V24.visits.first,
                    duration: updatedDuration,
                 } },
            ], { skip: 3 })
        })

        it('should delete vists', async () => {
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalContentRead', testReads.first.id],
                    [DataChangeType.Delete, 'personalContentRead', testReads.second.id],
                ], { skip: 6 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalContentRead: [],
            })
            // prettier-ignore
            // await testDownload([
            // TODO: confirm that we don't want to download a tag delete action
            //     { type: PersonalCloudUpdateType.Delete, collection: 'visits', where: { } }
            // ], { skip: 4 })
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
                .createObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.first.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [remoteData.personalTag.first],
                personalTagConnection: [
                    remoteData.personalTagConnection.first,
                ],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'tags', object: LOCAL_TEST_DATA_V24.tags.first },
            ], { skip: 2 })
        })

        it.todo('should connect existing page tags')

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
                .createObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            expect(
                await getDatabaseContents(
                    serverStorage.storageManager,
                    [
                        'personalDataChange',
                        'personalContentMetadata',
                        'personalContentLocator',
                        'personalTag',
                        'personalTagConnection',
                    ],
                    { getWhere: getPersonalWhere },
                ),
            ).toEqual({
                personalDataChange: dataChanges(
                    remoteData,
                    [
                        // TODO: Figure out if cloud should delete tag when no more connections left
                        // [DataChangeType.Delete, 'personalTag', testTags.first.id],
                        [
                            DataChangeType.Delete,
                            'personalTagConnection',
                            testConnections.first.id,
                        ],
                    ],
                    { skip: 6 },
                ),
                personalContentMetadata: [
                    testMetadata.first,
                    testMetadata.second,
                ],
                personalContentLocator: [
                    testLocators.first,
                    testLocators.second,
                ],
                personalTagConnection: [],
                personalTag: [testTags.first],
            })

            // prettier-ignore
            // TODO: confirm that we don't want to download a tag delete action
            // await testDownload([
            //     { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.first },
            // ], { skip: 0 })
        })

        it('should add note tags', async () => {
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
                .createObject(LOCAL_TEST_DATA_V24.tags.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalTag', testTags.second.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.second.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [remoteData.personalTagConnection.second],
                personalTag: [remoteData.personalTag.second],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'tags', object: LOCAL_TEST_DATA_V24.tags.second },
            ], { skip: 5 })
        })

        it.todo('should connect existing note tags')

        it('should remove note tags', async () => {
            const {
                setups,
                serverIdCapturer,
                serverStorage,
                testDownload,
            } = await setup()
            await insertTestPages(setups[0].storageManager)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(LOCAL_TEST_DATA_V24.tags.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                // TODO: Figure out what's needed to support tags in new cloud collections
                // personalDataChange: dataChanges(remoteData, [
                //     [DataChangeType.Delete, 'personalTag', testTags.second.id],
                //     [DataChangeType.Delete, 'personalTagConnection', testConnections.second.id],
                // ], { skip: 6 }),
                // personalContentMetadata: [testMetadata.first, testMetadata.second],
                // personalContentLocator: [testLocators.first, testLocators.second],
                // personalTagConnection: [],
                // personalTag: [],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.second },
            ], { skip: 4 })
        })
    })
})
