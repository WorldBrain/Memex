import moment from 'moment'

import type { RootState } from './types'

export const deriveStatusIconColor = ({
    syncState,
    backupState,
    lastSuccessfulSyncDate,
}: RootState): 'green' | 'red' | 'yellow' => {
    const daysSinceLastSync = moment().diff(
        moment(lastSuccessfulSyncDate),
        'days',
    )

    if (
        syncState === 'error' ||
        daysSinceLastSync > 7 ||
        backupState === 'error'
    ) {
        return 'red'
    }

    if (
        (syncState === 'disabled' || daysSinceLastSync > 3) &&
        backupState === 'disabled'
    ) {
        return 'yellow'
    }

    return 'green'
}
