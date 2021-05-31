import StorageManager from '@worldbrain/storex'
import { setupSyncBackgroundTest } from '../index.tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    LOCAL_TEST_DATA_V24,
    REMOTE_TEST_DATA_V24,
} from './translation-layer.test.data'

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

        it('should work for created pages', async () => {
            const { setups, serverStorage } = await setup()
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
            await setups[0].backgroundModules.personalCloud.waitForSync()
            expect(
                await getDatabaseContents(serverStorage.storageManager, [
                    'personalContentMetadata',
                    'personalContentLocator',
                ]),
            ).toEqual({
                personalContentMetadata: [
                    REMOTE_TEST_DATA_V24.personalContentMetadata.first,
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.first,
                ],
            })
        })

        it('should work for updated pages', async () => {
            const { setups, serverStorage } = await setup()
            await setups[0].storageManager
                .collection('pages')
                .createObject(LOCAL_TEST_DATA_V24.pages.first)
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
                ],
                personalContentLocator: [
                    REMOTE_TEST_DATA_V24.personalContentLocator.first,
                ],
            })
        })
    })
})
