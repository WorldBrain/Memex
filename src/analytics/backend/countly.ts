import { AnalyticsBackend } from './types'
import {
    AnalyticsEvent,
    AnalyticsEvents,
    AnalyticsTrackEventOptions,
} from '../types'

export default class CountlyAnalyticsBackend implements AnalyticsBackend {
    static DEF_TRACKING = true

    constructor(
        private props: {
            countlyConnector: any
            fetchUserId: () => Promise<string>
            appKey: string
            url: string
        },
    ) {
        // TODO: what if invalid appkey/url is passed? Does Countly.init() throw an error?
        if (
            !props.appKey ||
            !props.url ||
            (process.env.NODE_ENV === 'development' &&
                process.env.DEV_ANALYTICS !== 'true')
        ) {
            throw new Error('Cannot connect to Countly server')
        }

        props.countlyConnector.app_key = props.appKey
        props.countlyConnector.url = props.url
        props.countlyConnector.init()
    }

    private get countlyQueue() {
        return this.props.countlyConnector.q
    }

    private enqueueEvent({ key, userId, value = null }) {
        this.countlyQueue.push([
            'add_event',
            {
                key,
                count: 1,
                segmentation: {
                    userId,
                    ...(value ? { value } : {}),
                },
            },
        ])
    }

    async trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ) {
        const userId = await this.props.fetchUserId()
        if (!userId) {
            return
        }

        this.enqueueEvent({
            userId,
            key: `${event.category}::${event.action}`,
            value: event.value,
        })
    }
}
