import StorageManager from '@worldbrain/storex'
import { setupSyncBackgroundTest } from '../index.tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
} from './translation-layer.test.data'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'

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
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalContentMetadata: [
                    REMOTE_TEST_DATA_V24.personalContentMetadata.first,
                    REMOTE_TEST_DATA_V24.personalContentMetadata.second,
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.first,
                    REMOTE_TEST_DATA_V24.personalContentLocator.second,
                ],
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
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalContentMetadata: [
                    {
                        ...REMOTE_TEST_DATA_V24.personalContentMetadata.first,
                        title: 'Updated title',
                    },
                    REMOTE_TEST_DATA_V24.personalContentMetadata.second,
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.first,
                    REMOTE_TEST_DATA_V24.personalContentLocator.second,
                ],
            })
        })

        it('should delete pages', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager.collection('pages').deleteObjects({
                url: LOCAL_TEST_DATA_V24.pages.first.url,
            })
            await setups[0].backgroundModules.personalCloud.waitForSync()
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalContentMetadata: [
                    REMOTE_TEST_DATA_V24.personalContentMetadata.second,
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.second,
                ],
            })
        })

        it.todo('should create visits')
        it.todo('should update vists')
        it.todo('should delete vists')

        it('should create page tags', async () => {
            const { setups, serverStorage } = await setup()
            await insertTestPages(setups)
            await setups[0].storageManager
                .collection('tags')
                .createObject(LOCAL_TEST_DATA_V24.tags.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalContentMetadata',
                    'personalContentLocator',
                    'personalTag',
                    'personalTagConnection',
                ]),
            ).toEqual({
                personalContentMetadata: [
                    REMOTE_TEST_DATA_V24.personalContentMetadata.first,
                    REMOTE_TEST_DATA_V24.personalContentMetadata.second,
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.first,
                    REMOTE_TEST_DATA_V24.personalContentLocator.second,
                ],
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
