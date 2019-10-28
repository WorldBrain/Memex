import { SyncSecretStore } from './secrets'
import MemoryBrowserStorage, {
    LimitedBrowserStorage,
} from 'src/util/tests/browser-storage'

const TEST_KEY =
    'HYUg1vOkQngmZzlOPzjREvs5z4JHkAz5W9TjnNyHpU91yMcdAJh07MamvLHIsLXjbL9aWj4ytkFTdtaUU1vD/Q=='

describe('SyncSecretStore', () => {
    function setupStore(options: { browserStorage: LimitedBrowserStorage }) {
        return new SyncSecretStore({
            browserAPIs: {
                storage: {
                    local: options.browserStorage,
                },
            },
        })
    }

    async function setupTest() {
        const browserStorage = new MemoryBrowserStorage()
        const secretStore = setupStore({ browserStorage })

        return { secretStore, browserStorage }
    }

    it('should store the key in memory when generating a new one', async () => {
        const { secretStore } = await setupTest()
        await secretStore.generateSyncEncryptionKey()
        expect(
            (await secretStore.getSyncEncryptionKey()).length,
        ).toBeGreaterThan(5)
    })

    it('should store the key in storage when generating a new one', async () => {
        const {
            secretStore: firstSecretStore,
            browserStorage,
        } = await setupTest()
        await firstSecretStore.generateSyncEncryptionKey()

        const secondStore = setupStore({ browserStorage })
        expect(
            (await secondStore.getSyncEncryptionKey()).length,
        ).toBeGreaterThan(5)
    })

    it('should store a manually set key in memory', async () => {
        const { secretStore } = await setupTest()
        await secretStore.setSyncEncryptionKey(TEST_KEY)
        expect(await secretStore.getSyncEncryptionKey()).toEqual(TEST_KEY)
    })

    it('should store a manually set key in storage', async () => {
        const {
            secretStore: firstSecretStore,
            browserStorage,
        } = await setupTest()
        await firstSecretStore.setSyncEncryptionKey(TEST_KEY)

        const secondStore = setupStore({ browserStorage })
        expect(await secondStore.getSyncEncryptionKey()).toEqual(TEST_KEY)
    })

    it('should encrypt and decrypt a sync message', async () => {
        const { secretStore } = await setupTest()
        await secretStore.generateSyncEncryptionKey()
        const original = 'top secret'
        const encrypted = await secretStore.encryptSyncMessage(original)
        expect(encrypted.message).not.toEqual(original)
        const decrypted = await secretStore.decryptSyncMessage(encrypted)
        expect(decrypted).toEqual(original)
    })

    it('should encrypt and decrypt a sync message with unicode characters', async () => {
        const { secretStore } = await setupTest()
        await secretStore.generateSyncEncryptionKey()
        const original = 'test 𝌆 foo'
        const encrypted = await secretStore.encryptSyncMessage(original)
        expect(encrypted.message).not.toEqual(original)
        const decrypted = await secretStore.decryptSyncMessage(encrypted)
        expect(decrypted).toEqual(original)
    })

    it('should encrypt sync message with different nonces every time', async () => {
        const { secretStore } = await setupTest()
        await secretStore.generateSyncEncryptionKey()
        const original = 'top secret'
        const firstEncrypted = await secretStore.encryptSyncMessage(original)
        const secondEncrypted = await secretStore.encryptSyncMessage(original)
        expect(firstEncrypted.message).not.toEqual(secondEncrypted.message)
    })

    it('should throw an error if trying to encrypt a message without a key', async () => {
        const { secretStore } = await setupTest()
        await expect(secretStore.encryptSyncMessage('bla')).rejects.toThrow(
            'Tried to encrypt sync message without a key',
        )
    })

    it('should throw an error if trying to encrypt a message without a key', async () => {
        const { secretStore } = await setupTest()
        await expect(
            secretStore.decryptSyncMessage({ message: 'bla' }),
        ).rejects.toThrow('Tried to decrypt sync message without a key')
    })
})
