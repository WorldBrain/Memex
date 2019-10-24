import nacl from 'tweetnacl'
import { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import encodeBlob from 'src/util/encode-blob'
import decodeBlob from 'src/util/decode-blob'
import { blobToBuffer, bufferToBlob } from 'src/util/blob-utils'
import { stringToUint8Array, uint8ArrayToBase64, str2ab, ab2str } from './utils'

export class SyncSecretStore {
    private key: Uint8Array | null = null
    private loaded = false

    constructor(
        private options: {
            browserAPIs: {
                storage: { local: LimitedBrowserStorage }
            }
        },
    ) {}

    async generateSyncEncryptionKey(): Promise<void> {
        this.key = nacl.randomBytes(nacl.secretbox.keyLength)
        await this._storeKey()
    }

    async getSyncEncryptionKey(): Promise<string | null> {
        if (!this.loaded) {
            await this._loadKey()
        }
        return this.key && uint8ArrayToBase64(this.key)
    }

    async setSyncEncryptionKey(key: string): Promise<void> {
        this.key = await stringToUint8Array(key)
        await this._storeKey()
    }

    async encryptSyncMessage(
        message: string,
    ): Promise<{ message: string; nonce: string }> {
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
        const messageArray = new Uint8Array(str2ab(message))
        console.log('in', messageArray)
        const encrypted = nacl.secretbox(messageArray, nonce, this.key)
        return {
            message: await uint8ArrayToBase64(encrypted),
            nonce: await uint8ArrayToBase64(nonce),
        }
    }

    async decryptSyncMessage(encrypted: {
        message: string
        nonce: string
    }): Promise<string> {
        const decrypted = nacl.secretbox.open(
            await stringToUint8Array(encrypted.message),
            await stringToUint8Array(encrypted.nonce),
            this.key,
        )

        console.log('out', decrypted)
        return ab2str(decrypted)
    }

    async _storeKey() {
        await this.options.browserAPIs.storage.local.set({
            [SYNC_STORAGE_AREA_KEYS.encryptionKey]: await uint8ArrayToBase64(
                this.key,
            ),
        })
    }

    async _loadKey() {
        const storageKey = SYNC_STORAGE_AREA_KEYS.encryptionKey
        const retrieved = await this.options.browserAPIs.storage.local.get([
            storageKey,
        ])
        const retrievedKey: string | null = retrieved[storageKey]
        if (retrievedKey) {
            this.key = await stringToUint8Array(retrievedKey)
            this.loaded = true
        }
    }
}
