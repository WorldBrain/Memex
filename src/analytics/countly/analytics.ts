// tslint:disable:no-console
import { fetchUserId, shouldTrack } from '../utils'

class Analytics {
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

    private enqueueEvent({ key, id }) {
        this.countlyConnector.q.push([
            'add_event',
            {
                key,
                count: 1,
                segmentation: { id },
            },
        ])
    }

    async trackEvent(params: { type: string }) {
        const shouldTrackValue = await shouldTrack(Analytics.DEF_TRACKING)
        const userId = await fetchUserId()

        if (process.env.DEBUG_ANALYTICS_EVENTS === 'true') {
            console.log('Tracking event', shouldTrackValue, userId, params)
        }

        if (!shouldTrackValue || !userId) {
            return
        }

        return this.enqueueEvent({ id: userId, key: params.type })
    }
}

export default Analytics
