import StorageManager from '@worldbrain/storex'
import { setupSyncBackgroundTest } from '../index.tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
} from './translation-layer.test.data'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { DataChangeType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

async function getDatabaseContents(
    storageManager: StorageManager,
    collections: string[],
) {
    const contents: { [collection: string]: any[] } = {}
    await Promise.all(
        collections.map(async (collection) => {
            contents[collection] = await storageManager
                .collection(collection)
                .findObjects(
                    {},
                    {
                        order: [['createdWhen', 'asc']],
                    },
                )
        }),
    )
    return contents
}

function dataChanges(
    changes: Array<
        [
            /* type: */ DataChangeType,
            /* collection: */ string,
            /* id: */ string | number,
        ]
    >,
    options?: { skip?: number },
) {
    let id = 0
    let now = 554
    const advance = () => {
        ++id
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
                id,
                createdWhen: now,
                createdByDevice:
                    REMOTE_TEST_DATA_V24.personalDeviceInfo.first.id,
                user: TEST_USER.id,
                type: change[0],
                collection: change[1],
                objectId: change[2],
            }
        }),
    ]
}

describe('Personal cloud translation layer', () => {
    describe(`from local schema version 24`, () => {
        async function setup() {
            const { setups, serverStorage } = await setupSyncBackgroundTest({
                deviceCount: 2,
            })
            return { setups, serverStorage }
        }
        async function insertTestPages(
            setups: BackgroundIntegrationTestSetup[],
        ) {
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.second)
        }

        it('should create pages', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const testMetadata = REMOTE_TEST_DATA_V24.personalContentMetadata
            const testLocators = REMOTE_TEST_DATA_V24.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalDataChange: dataChanges([
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.first.id],
                    [DataChangeType.Create, 'personalContentMetadata', testMetadata.second.id],
                    [DataChangeType.Create, 'personalContentLocator', testLocators.second.id],
                ]),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
            })
        })

        it('should update pages', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager.collection('pages').updateObjects(
                {
                    url: LOCAL_TEST_DATA_V24.pages.first.url,
                },
                { fullTitle: 'Updated title' },
            )
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const testMetadata = REMOTE_TEST_DATA_V24.personalContentMetadata
            const testLocators = REMOTE_TEST_DATA_V24.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalDataChange: dataChanges([
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
        })

        it('should delete pages', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager.collection('pages').deleteObjects({
                url: LOCAL_TEST_DATA_V24.pages.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const testMetadata = REMOTE_TEST_DATA_V24.personalContentMetadata
            const testLocators = REMOTE_TEST_DATA_V24.personalContentLocator

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalDataChange: dataChanges([
                    [DataChangeType.Delete, 'personalContentMetadata', testMetadata.first.id],
                    [DataChangeType.Delete, 'personalContentLocator', testLocators.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.second],
                personalContentLocator: [testLocators.second],
            })
        })

        it('should create visits', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager
                .collection('visits')
                .createObject(LOCAL_TEST_DATA_V24.visits.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const testMetadata = REMOTE_TEST_DATA_V24.personalContentMetadata
            const testLocators = REMOTE_TEST_DATA_V24.personalContentLocator
            const testReads = REMOTE_TEST_DATA_V24.personalContentRead

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalContentRead',
                ]),
            ).toEqual({
                personalDataChange: dataChanges([
                    [DataChangeType.Create, 'personalContentRead', testReads.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalContentRead: [testReads.first],
            })
        })

        it.todo('should update vists')
        it.todo('should delete vists')

        it('should create page tags', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()

            const testMetadata = REMOTE_TEST_DATA_V24.personalContentMetadata
            const testLocators = REMOTE_TEST_DATA_V24.personalContentLocator
            const testTags = REMOTE_TEST_DATA_V24.personalTag
            const testConnections = REMOTE_TEST_DATA_V24.personalTagConnection

            // prettier-ignore
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalDataChange',
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ]),
            ).toEqual({
                personalDataChange: dataChanges([
                    [DataChangeType.Create, 'personalTag', testTags.first.id],
                    [DataChangeType.Create, 'personalTagConnection', testConnections.first.id],
                ], { skip: 4 }),
                personalContentMetadata: [testMetadata.first, testMetadata.second],
                personalContentLocator: [testLocators.first, testLocators.second],
                personalTag: [REMOTE_TEST_DATA_V24.personalTag.first],
                personalTagConnection: [
                    REMOTE_TEST_DATA_V24.personalTagConnection.first,
                ],
            })
        })

        it.todo('should connect existing page tags')
        it.todo('should remove page tags')
        it.todo('should add note tags')
        it.todo('should connect existing note tags')
        it.todo('should remove note tags')
    })
})
