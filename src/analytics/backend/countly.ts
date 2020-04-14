import { AnalyticsBackend } from './types'
import {
    AnalyticsEvent,
    AnalyticsEvents,
    AnalyticsTrackEventOptions,
} from '../types'

export type CountlyEvent = any
export type CountlyQueue = Array<[string, CountlyEvent]>

export interface Props {
    fetchUserId: () => Promise<string>
    countlyConnector: any
    appKey: string
    url: string
}

export default class CountlyAnalyticsBackend implements AnalyticsBackend {
    static DEF_TRACKING = true
    private isSetup = false

    constructor(private props: Props) {}

    async init() {
        if (this.isSetup) {
            return
        }

        const userId = await this.props.fetchUserId()

        this.props.countlyConnector.app_key = this.props.appKey
        this.props.countlyConnector.url = this.props.url
        this.props.countlyConnector.device_id = userId
        this.props.countlyConnector.init()

        this.isSetup = true
    }

    private get countlyQueue(): CountlyQueue {
        return this.props.countlyConnector.q
    }

    private enqueueEvent({ key, value = null }: { key: string; value: any }) {
        this.countlyQueue.push([
            'add_event',
            {
                key,
                count: 1,
                segmentation: {
                    ...(value ? { value } : {}),
                },
            },
        ])
    }

    async trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ) {
        await this.init()

        this.enqueueEvent({
            key: `${event.category}::${event.action}`,
            value: event.value,
        })
    }
}
