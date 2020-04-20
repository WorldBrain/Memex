import { AnalyticsBackend } from './types'
import {
    AnalyticsEvent,
    AnalyticsEvents,
    AnalyticsTrackEventOptions,
} from '../types'

export type CountlyEvent = any
export type CountlyQueue = Array<CountlyQueueEntry>
export type CountlyQueueEntry = [string, CountlyEvent] | [string]

export interface Props {
    fetchUserId: () => Promise<string>
    countlyConnector: any
    appKey: string
    url: string
}

export default class CountlyAnalyticsBackend implements AnalyticsBackend {
    static DEF_TRACKING = true
    private setupPromise: Promise<void>
    private resolveSetupPromise: () => void

    constructor(private props: Props) {}

    private async init() {
        if (this.setupPromise) {
            return this.setupPromise
        }

        this.setupPromise = new Promise<void>(resolve => {
            this.resolveSetupPromise = resolve
        })

        const userId = await this.props.fetchUserId()

        this.props.countlyConnector.init({
            device_id: userId,
            app_key: this.props.appKey,
            url: this.props.url,
        })
        this.enqueue('track_sessions')
        return this.resolveSetupPromise()
    }

    private get countlyQueue(): CountlyQueue {
        return this.props.countlyConnector.q
    }

    private enqueue<T = any>(key: string, payload?: T) {
        const entry: CountlyQueueEntry = payload ? [key, payload] : [key]
        this.countlyQueue.push(entry)
    }

    private enqueueEvent({
        name,
        value = null,
        count = 1,
    }: {
        name: string
        value?: any
        count?: number
    }) {
        return this.enqueue('add_event', {
            key: name,
            count,
            segmentation: {
                ...(value ? { value } : {}),
            },
        })
    }

    async trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ) {
        await this.init()

        this.enqueueEvent({
            name: `${event.category}::${event.action}`,
            value: event.value,
        })
    }
}
