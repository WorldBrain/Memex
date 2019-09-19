import { AuthenticatedUser } from './types'
import { browser } from 'webextension-polyfill-ts'

export default class AuthBackground {
    userId: string | number | null = null

    async setup() {
        this.userId = (await browser.storage.local.get('testUserId')).testUserId
    }

    getCurrentUser(): AuthenticatedUser | null {
        return this.userId ? { id: this.userId } : null
    }
}
