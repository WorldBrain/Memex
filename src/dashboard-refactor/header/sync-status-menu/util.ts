import { RootState } from './types'

export const deriveStatusIconColor = ({
    syncState,
    backupState,
}: RootState): 'green' | 'red' | 'yellow' => {
    if (syncState === 'error' || backupState === 'error') {
        return 'red'
    }

    if (syncState === 'disabled' && backupState === 'disabled') {
        return 'yellow'
    }

    return 'green'
}
