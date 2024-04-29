import type { RootState } from '../../types'

export const deriveStatusIconColor = ({
    currentUser,
    syncMenu: { pendingLocalChangeCount, pendingRemoteChangeCount },
}: RootState): 'green' | 'red' | 'yellow' => {
    if (currentUser?.email.length === 0) {
        return 'yellow'
    }

    if (currentUser == null) {
        return 'red'
    }
    if (pendingLocalChangeCount == null && pendingRemoteChangeCount == null) {
        return 'yellow'
    }

    if (pendingLocalChangeCount > 0 || pendingRemoteChangeCount > 0) {
        return 'yellow'
    }
    if (pendingLocalChangeCount === 0 || pendingRemoteChangeCount === 0) {
        return 'green'
    }

    return 'yellow'
}
