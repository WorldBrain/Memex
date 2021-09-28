import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'

export interface LocalExtensionSettings {
    installTimestamp: number
    mostRecentUser: AuthenticatedUser | null
}
