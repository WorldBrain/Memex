import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'

import { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export type ActivityStatus =
    | 'has-unseen'
    | 'all-seen'
    | 'not-logged-in'
    | 'error'

export interface ActivityIndicatorInterface {
    hasUnseenActivity: () => Promise<ActivityStatus>
}

export default class ActivityIndicatorBackground {
    remoteFunctions: ActivityIndicatorInterface

    constructor(
        private options: {
            getActivityStreamsStorage: () => Promise<ActivityStreamsStorage>
            services: Pick<Services, 'activityStreams' | 'auth'>
        },
    ) {
        this.remoteFunctions = {
            hasUnseenActivity: this.hasUnseenActivity,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    hasUnseenActivity: ActivityIndicatorInterface['hasUnseenActivity'] = async () => {
        return 'not-logged-in'
    }
}
