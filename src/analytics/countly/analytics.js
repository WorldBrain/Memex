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

        this._countlyConnector.init({
            app_key: appKey,
            url: url,
        })
    }

    /**
     * Send a request to the Countly Sever.
     *
     * @param {any} params
     * @return {Promise<Response>}
     */
    _sendReq = async params => {
        if (!(await this.shouldTrack())) {
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

        return this._countlyConnector.q.push(params)
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
