import moment from 'moment'

import type { RootState } from './types'

const getDaysSinceDate = (date: Date | null): number =>
    date == null ? 0 : moment().diff(moment(date), 'days')

export const deriveStatusIconColor = ({
    syncState,
    backupState,
    lastSuccessfulSyncDate,
    lastSuccessfulBackupDate,
}: RootState): 'green' | 'red' | 'yellow' => {
    const daysSinceLastSync = getDaysSinceDate(lastSuccessfulSyncDate)
    const daysSinceLastBackup = getDaysSinceDate(lastSuccessfulBackupDate)

    if (
        syncState === 'error' ||
        backupState === 'error' ||
        daysSinceLastSync > 7 ||
        daysSinceLastBackup > 7
    ) {
        return 'red'
    }

    if (
        (syncState === 'disabled' && backupState === 'disabled') ||
        daysSinceLastBackup > 3 ||
        daysSinceLastSync > 3
    ) {
        return 'yellow'
    }

    return 'green'
}
