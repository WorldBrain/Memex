import { AuthenticatedUser } from './types'

export default class AuthBackground {
    userId?: string

    getCurrentUser(): AuthenticatedUser | null {
        return this.userId ? { id: this.userId } : null
    }
}
