import PiwikAnalytics from '../'
import CustomAnalytics from '../internal/send-to-server'

class Analytics {
    /**
     * @param {Object} args
     * @param {string} args.countlyConnector Connector to the Countly.
     * @param {string} args.url url of the counly server.
     * @param {string} args.appKey app key of the counly server.
     */
    constructor({ countlyConnector, url, appKey }) {
        this._countlyConnector = countlyConnector

        // Asynchronous initialization of Countly
        this._countlyConnector.app_key = appKey
        this._countlyConnector.url = url
    }

    /**
     * Send a request to the Countly Sever.
     *
     * @param {any} params
     * @return {Promise<Response>}
     */
    _sendReq = async params => {
        if (!(await PiwikAnalytics.shouldTrack())) {
            return
        }

        const userId = await CustomAnalytics.fetchUserId()

        if (!userId) {
            return
        }

        params = {
            ...params,
            segmentation: {
                id: userId,
            },
        }

        // Async add event to countly
        return this._countlyConnector.q.push([
            'add_event',
            {
                key: params.key,
                count: 1,
                segmentation: {
                    id: userId,
                },
            },
        ])
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async trackEvent(eventArgs) {
        const shouldTrack = await PiwikAnalytics.shouldTrack()
        if (process.env.DEBUG_ANALYTICS_EVENTS === 'true') {
            console.log('Tracking event', shouldTrack, eventArgs)
        }
        if (!shouldTrack) {
            return
        }

        const params = {
            key: eventArgs.key,
            count: 1,
        }

        await this._sendReq(params).catch(console.error)
    }
}

export default Analytics
