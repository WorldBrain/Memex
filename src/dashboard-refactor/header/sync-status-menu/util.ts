import moment from 'moment'

import type { RootState } from '../../types'

const getDaysSinceDate = (date: Date | null): number =>
    date == null ? 0 : moment().diff(moment(date), 'days')

export const deriveStatusIconColor = ({
    currentUser,
    syncMenu: { pendingLocalChangeCount, pendingRemoteChangeCount },
}: RootState): 'green' | 'red' | 'yellow' => {
    if (currentUser == null) {
        return 'red'
    }

    if (pendingLocalChangeCount > 0 || pendingRemoteChangeCount > 0) {
        return 'yellow'
    }

    return 'green'
}
