import ActivityIndicatorService from '@worldbrain/memex-common/lib/activity-streams/services/activity-indicator'
import type ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import * as Raven from 'src/util/raven'

import type { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type { SyncSettingsStore } from 'src/sync-settings/util'

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
    private service: ActivityIndicatorService
    remoteFunctions: ActivityIndicatorInterface

    constructor(
        private options: {
            getActivityStreamsStorage: () => Promise<ActivityStreamsStorage>
            services: Pick<Services, 'activityStreams' | 'auth'>
            syncSettings: SyncSettingsStore<'activityIndicator'>
        },
    ) {
        this.service = new ActivityIndicatorService({
            authService: options.services.auth,
            activityStreamsService: options.services.activityStreams,
            getActivityStreamsStorage: options.getActivityStreamsStorage,
            getStatusCacheFlag: () =>
                options.syncSettings.activityIndicator.get('feedHasActivity'),
            setStatusCacheFlag: (hasActivity) =>
                options.syncSettings.activityIndicator.set(
                    'feedHasActivity',
                    hasActivity,
                ),
            captureError: (error) => Raven.captureException(error),
        })

        this.remoteFunctions = {
            checkActivityStatus: this.checkActivityStatus,
            markActivitiesAsSeen: this.markActivitiesAsSeen,
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    checkActivityStatus: ActivityIndicatorInterface['checkActivityStatus'] = async () => {
        return this.service.checkActivityStatus()
    }

    markActivitiesAsSeen = async () => {
        return this.service.markActivitiesAsSeen()

        // Below is the old implementation (not used since first implemented)
        // const { auth } = this.options.services

        // const user = await auth.getCurrentUser()
        // if (!user) {
        //     throw new Error('Cannot mark activities as seen if not logged in')
        // }

        // const storage = await this.options.getActivityStreamsStorage()

        // await storage.updateHomeFeedTimestamp({
        //     timestamp,
        //     user: { id: user.id, type: 'user-reference' },
        // })
    }
}
