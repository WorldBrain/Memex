import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'

import { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export type ActivityStatus =
    | 'has-unseen'
    | 'all-seen'
    | 'not-logged-in'
    | 'error'

export interface ActivityIndicatorInterface {
    checkActivityStatus: () => Promise<ActivityStatus>
    markActivitiesAsSeen: () => Promise<void>
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
            checkActivityStatus: this.checkActivityStatus,
            markActivitiesAsSeen: this.markActivitiesAsSeen,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    checkActivityStatus: ActivityIndicatorInterface['checkActivityStatus'] = async () => {
        const { activityStreams, auth } = this.options.services

        const user = await auth.getCurrentUser()
        if (!user) {
            return 'not-logged-in'
        }

        const storage = await this.options.getActivityStreamsStorage()

        try {
            const [serviceResult, storageResult] = await Promise.all([
                activityStreams.getHomeFeedInfo(),
                storage.retrieveHomeFeedTimestamp({
                    user: { type: 'user-reference', id: user.id },
                }),
            ])

            if (!serviceResult?.latestActivityTimestamp) {
                return 'all-seen'
            }

            if (!storageResult?.timestamp) {
                return 'has-unseen'
            }

            return serviceResult.latestActivityTimestamp >
                storageResult.timestamp
                ? 'has-unseen'
                : 'all-seen'
        } catch (err) {
            console.error(err)
            return 'error'
        }
    }

    markActivitiesAsSeen = async (timestamp = Date.now()) => {
        const { auth } = this.options.services

        const user = await auth.getCurrentUser()
        if (!user) {
            throw new Error('Cannot mark activities as seen if not logged in')
        }

        const storage = await this.options.getActivityStreamsStorage()

        await storage.updateHomeFeedTimestamp({
            timestamp,
            user: { id: user.id, type: 'user-reference' },
        })
    }
}
