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
import { AnnotationPrivacyLevels } from 'src/annotations/types'

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
                    [DataChangeType.Delete, 'personalContentRead', testReads.first.id, {
                        url: LOCAL_TEST_DATA_V24.visits.first.url,
                        time: LOCAL_TEST_DATA_V24.visits.first.time,
                    }],
                    [DataChangeType.Delete, 'personalContentRead', testReads.second.id, {
                        url: LOCAL_TEST_DATA_V24.visits.second.url,
                        time: LOCAL_TEST_DATA_V24.visits.second.time,
                    }],
                ], { skip: 6 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.second.id],
                ], { skip: 4 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotation', testAnnotations.first.id],
                ], { skip: 6 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.first.id, { url: LOCAL_TEST_DATA_V24.annotations.first.url }],
                    [DataChangeType.Delete, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Delete, 'personalAnnotation', testAnnotations.second.id, { url: LOCAL_TEST_DATA_V24.annotations.second.url }],
                ], { skip: 7 }),
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

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector
            const testPrivacyLevels = remoteData.personalAnnotationPrivacyLevel

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.first.id],
                    [DataChangeType.Create, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id],
                ], { skip: 7 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [testPrivacyLevels.first, testPrivacyLevels.second],
            })

            // prettier-ignore
            await testDownload([
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
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.second)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .createObject(
                    LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second,
                )
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotationPrivacyLevels')
                .updateOneObject(
                    {
                        id:
                            LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second
                                .id,
                    },
                    { privacyLevel: AnnotationPrivacyLevels.PRIVATE },
                )
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id],
                ], { skip: 8 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first, testAnnotations.second],
                personalAnnotationSelector: [testSelectors.first],
                personalAnnotationPrivacyLevel: [{ ...testPrivacyLevels.second, privacyLevel: AnnotationPrivacyLevels.PRIVATE }],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second, privacyLevel: AnnotationPrivacyLevels.PRIVATE } },
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotationPrivacyLevels', object: { ...LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second, privacyLevel: AnnotationPrivacyLevels.PRIVATE } },
            ], { skip: 4 })
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationPrivacyLevel'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationPrivacyLevel', testPrivacyLevels.second.id, changeInfo],
                ], { skip: 9 }),
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
                    'personalDataChange',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalList', testLists.first.id],
                    [DataChangeType.Create, 'personalList', testLists.second.id],
                ], { skip: 0 }),
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
                    'personalDataChange',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalList', testLists.first.id],
                ], { skip: 2 }),
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
                    'personalDataChange',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalList', testLists.first.id, { id: testLists.first.localId }],
                    [DataChangeType.Delete, 'personalList', testLists.second.id, { id: testLists.second.localId }],
                ], { skip: 2 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalListEntry', testListEntries.first.id],
                    [DataChangeType.Create, 'personalListEntry', testListEntries.second.id],
                ], { skip: 5 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalListEntry'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalListEntry', testListEntries.first.id, changeInfo],
                ], { skip: 7 }),
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
                    'personalDataChange',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalListShare', testListShares.first.id],
                ], { skip: 1 }),
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
                    'personalDataChange',
                    'personalListShare',
                    'personalList',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalListShare', testListShares.first.id, changeInfo],
                ], { skip: 2 }),
                personalList: [testLists.first],
                personalListShare: [],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'sharedListMetadata', where: changeInfo },
            ], { skip: 1 })
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.first.id],
                    [DataChangeType.Create, 'personalAnnotationShare', testAnnotationShares.second.id],
                ], { skip: 7 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalAnnotationShare', testAnnotationShares.second.id],

                ], { skip: 9 }),
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
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalAnnotationShare'
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalAnnotationShare', testAnnotationShares.second.id, changeInfo],
                ], { skip: 9 }),
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
                    [DataChangeType.Create, 'personalTagConnection', testConnections.pageTag.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [testTags.first],
                personalTagConnection: [testConnections.pageTag],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'tags', object: LOCAL_TEST_DATA_V24.tags.first },
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
                .createObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager.collection('tags').createObject({
                url: LOCAL_TEST_DATA_V24.pages.second.url,
                name: LOCAL_TEST_DATA_V24.tags.first.name,
            })
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
                    [DataChangeType.Create, 'personalTagConnection', testConnections.pageTag.id + 1],
                ], { skip: 6 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [testTags.first],
                personalTagConnection: [
                    testConnections.pageTag,
                    {
                        ...testConnections.pageTag,
                        id: testConnections.pageTag.id + 1,
                        objectId: testMetadata.second.id,
                    },
                ],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: {
                            url: LOCAL_TEST_DATA_V24.pages.second.url,
                            name: LOCAL_TEST_DATA_V24.tags.first.name,
                        },
                    },
                ],
                { skip: 3 },
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
                    // TODO: Figure out if cloud should delete tag when no more connections left
                    // [DataChangeType.Delete, 'personalTag', testTags.first.id],
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.pageTag.id, LOCAL_TEST_DATA_V24.tags.first],
                ], { skip: 6 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTagConnection: [],
                personalTag: [testTags.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: LOCAL_TEST_DATA_V24.tags.first },
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
            await setups[0].storageManager.collection('tags').createObject({
                name: LOCAL_TEST_DATA_V24.tags.first.name,
                url: LOCAL_TEST_DATA_V24.annotations.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalAnnotation', testAnnotations.first.id],
                    [DataChangeType.Create, 'personalAnnotationSelector', testSelectors.first.id],
                    [DataChangeType.Create, 'personalTag', testTags.first.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.annotationTag.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [testConnections.annotationTag],
                personalTag: [testTags.first],
            })

            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Overwrite, collection: 'annotations', object: LOCAL_TEST_DATA_V24.annotations.first },
                {
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'tags',
                    object: {
                        name: LOCAL_TEST_DATA_V24.tags.first.name,
                        url: LOCAL_TEST_DATA_V24.annotations.first.url,
                    },
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
            await setups[0].storageManager.collection('tags').createObject({
                name: LOCAL_TEST_DATA_V24.tags.first.name,
                url: LOCAL_TEST_DATA_V24.pages.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('annotations')
                .createObject(LOCAL_TEST_DATA_V24.annotations.first)
            await setups[0].storageManager.collection('tags').createObject({
                name: LOCAL_TEST_DATA_V24.tags.first.name,
                url: LOCAL_TEST_DATA_V24.annotations.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTagConnection', testConnections.annotationTag.id],
                ], { skip: 8 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [testConnections.pageTag, testConnections.annotationTag],
                personalTag: [testTags.first],
            })

            await testDownload(
                [
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        collection: 'tags',
                        object: {
                            name: LOCAL_TEST_DATA_V24.tags.first.name,
                            url: LOCAL_TEST_DATA_V24.annotations.first.url,
                        },
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
            const annotationTag = {
                name: LOCAL_TEST_DATA_V24.tags.first.name,
                url: LOCAL_TEST_DATA_V24.annotations.first.url,
            }
            await setups[0].storageManager
                .collection('tags')
                .createObject(annotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[0].storageManager
                .collection('tags')
                .deleteOneObject(annotationTag)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const remoteData = serverIdCapturer.mergeIds(REMOTE_TEST_DATA_V24)
            const testMetadata = remoteData.personalContentMetadata
            const testLocators = remoteData.personalContentLocator
            const testTags = remoteData.personalTag
            const testConnections = remoteData.personalTagConnection
            const testAnnotations = remoteData.personalAnnotation
            const testSelectors = remoteData.personalAnnotationSelector

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalAnnotation',
                    'personalAnnotationSelector',
                    'personalTag',
                    'personalTagConnection',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTag', testTags.first.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.annotationTag.id],
                    [DataChangeType.Delete, 'personalTagConnection', testConnections.annotationTag.id, annotationTag],
                ], { skip: 6 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalAnnotation: [testAnnotations.first],
                personalAnnotationSelector: [testSelectors.first],
                personalTagConnection: [],
                personalTag: [testTags.first],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'tags', where: annotationTag },
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
                    'personalDataChange',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Create, 'personalTextTemplate', testTemplates.first.id],
                    [DataChangeType.Create, 'personalTextTemplate', testTemplates.second.id],
                ], { skip: 0 }),
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
                    'personalDataChange',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Modify, 'personalTextTemplate', testTemplates.first.id],
                    [DataChangeType.Modify, 'personalTextTemplate', testTemplates.second.id],
                ], { skip: 2 }),
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
                    'personalDataChange',
                    'personalTextTemplate',
                ], { getWhere: getPersonalWhere }),
            ).toEqual({
                personalDataChange: dataChanges(remoteData, [
                    [DataChangeType.Delete, 'personalTextTemplate', testTemplates.first.id, { id: LOCAL_TEST_DATA_V24.templates.first.id }],
                    [DataChangeType.Delete, 'personalTextTemplate', testTemplates.second.id, { id: LOCAL_TEST_DATA_V24.templates.second.id }],
                ], { skip: 2 }),
                personalTextTemplate: [],
            })
            // prettier-ignore
            await testDownload([
                { type: PersonalCloudUpdateType.Delete, collection: 'templates', where: { id: LOCAL_TEST_DATA_V24.templates.first.id } },
                { type: PersonalCloudUpdateType.Delete, collection: 'templates', where: { id: LOCAL_TEST_DATA_V24.templates.second.id } },
            ], { skip: 0 })
        })
    })
})
