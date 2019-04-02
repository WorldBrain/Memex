// tslint:disable:no-console
import { fetchUserId, shouldTrack } from '../utils'
import { AnalyticsBackend } from './types'
import { AnalyticsEvent, AnalyticsTrackEventOptions } from '../types'

export default class CountlyAnalyticsBackend implements AnalyticsBackend {
    static DEF_TRACKING = true

    private countlyConnector

    /**
     * @param {Object} args
     * @param {string} args.countlyConnector Connector to the Countly.
     * @param {string} args.url url of the counly server.
     * @param {string} args.appKey app key of the counly server.
     */
    constructor({
        countlyConnector,
        ...args
    }: {
        countlyConnector: any
        url: string
        appKey: string
    }) {
        this.countlyConnector = countlyConnector

        this.initCountly(args)
    }

    private initCountly({ url, appKey }) {
        this.countlyConnector.app_key = appKey
        this.countlyConnector.url = url
        this.countlyConnector.init()
    }

    private enqueueEvent({ key, id, value }) {
        const event = [
            'add_event',
            {
                key,
                count: 1,
                segmentation: {
                    id,
                    ...(value ? { value } : {}),
                },
            },
        ]
        console.log('Queuing Countly event', event)
        this.countlyConnector.q.push(event)
    }

    async trackEvent(
        event: AnalyticsEvent,
        options?: AnalyticsTrackEventOptions,
    ) {
        const userId = await fetchUserId()
        if (!userId) {
            return
        }

        return this.enqueueEvent({
            id: userId,
            key: `${event.category}:${event.action}`,
            value: event.value,
        })
    }
}
