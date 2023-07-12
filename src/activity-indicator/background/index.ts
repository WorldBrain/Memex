import ActivityIndicatorService from '@worldbrain/memex-common/lib/activity-streams/services/activity-indicator'
import type { ActivityStreamsStorage } from '@worldbrain/memex-common/lib/activity-streams/storage/types'
import * as Raven from 'src/util/raven'

import type { AuthServices, Services } from 'src/services/types'
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
            authServices: Pick<AuthServices, 'auth'>
            servicesPromise: Promise<Pick<Services, 'activityStreams'>>
            syncSettings: SyncSettingsStore<'activityIndicator'>
        },
    ) {
        options.servicesPromise.then((services) => {
            this.service = new ActivityIndicatorService({
                authService: options.authServices.auth,
                activityStreamsService: services.activityStreams,
                getActivityStreamsStorage: options.getActivityStreamsStorage,
                getStatusCacheFlag: () =>
                    options.syncSettings.activityIndicator.get(
                        'feedHasActivity',
                    ),
                setStatusCacheFlag: (hasActivity) =>
                    options.syncSettings.activityIndicator.set(
                        'feedHasActivity',
                        hasActivity,
                    ),
                captureError: (error) => Raven.captureException(error),
            })
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
        await this.options.servicesPromise
        return this.service.checkActivityStatus()
    }

    markActivitiesAsSeen = async () => {
        await this.options.servicesPromise
        await this.service.markActivitiesAsSeen()
        return

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
