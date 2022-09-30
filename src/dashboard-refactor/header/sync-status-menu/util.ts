import type { RootState } from '../../types'

export const deriveStatusIconColor = ({
    currentUser,
    isCloudEnabled,
    syncMenu: { pendingLocalChangeCount, pendingRemoteChangeCount },
}: RootState): 'green' | 'red' | 'yellow' => {
    if (currentUser == null || !isCloudEnabled) {
        return 'red'
    }

    if (pendingLocalChangeCount > 0 || pendingRemoteChangeCount > 0) {
        return 'yellow'
    }

    return 'green'
}
