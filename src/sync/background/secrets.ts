import * as openpgp from 'openpgp'
import nacl from 'tweetnacl'
import { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import { ab2str } from './utils'

export class SyncSecretStore {
    private key: string | null = null
    private loaded = false

    constructor(
        private options: {
            browserAPIs: {
                storage: { local: LimitedBrowserStorage }
            }
        },
    ) {}

    async generateSyncEncryptionKey(): Promise<void> {
        this.key = ab2str(nacl.randomBytes(nacl.secretbox.keyLength))
        await this._storeKey()
    }

    async getSyncEncryptionKey(): Promise<string | null> {
        if (!this.loaded) {
            await this._loadKey()
        }
        return this.key
    }

    async setSyncEncryptionKey(key: string): Promise<void> {
        this.key = key
        await this._storeKey()
    }

    async encryptSyncMessage(
        message: string,
    ): Promise<{ message: string; nonce?: string }> {
        if (!this.key) {
            throw new Error('Tried to encrypt sync message without a key')
        }

        return {
            message: (await openpgp.encrypt({
                message: openpgp.message.fromText(message),
                passwords: [this.key],
                armor: true,
            })).data,
            nonce: '',
        }
    }

    async decryptSyncMessage(encrypted: {
        message: string
        nonce?: string
    }): Promise<string> {
        if (!this.key) {
            throw new Error('Tried to decrypt sync message without a key')
        }

        return (await openpgp.decrypt({
            message: await openpgp.message.readArmored(encrypted.message),
            passwords: [this.key],
            format: 'utf8',
        })).data as string
    }

    async _storeKey() {
        await this.options.browserAPIs.storage.local.set({
            [SYNC_STORAGE_AREA_KEYS.encryptionKey]: this.key,
        })
    }

    async _loadKey() {
        const storageKey = SYNC_STORAGE_AREA_KEYS.encryptionKey
        const retrieved = await this.options.browserAPIs.storage.local.get([
            storageKey,
        ])
        const retrievedKey: string | null = retrieved[storageKey]
        if (retrievedKey) {
            this.key = retrievedKey
            this.loaded = true
        }
    }
}
