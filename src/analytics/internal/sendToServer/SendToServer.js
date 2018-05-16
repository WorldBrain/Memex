import { idleManager } from 'src/util/idle'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'

class SendToServer {
    static API_PATH = './'
    static JSON_HEADERS = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
    }

    /**
     * Pool of requests that have been tracked, which will be periodically cleared and sent off in bulk.
     */
    _pool = new Set()

    /**
     * @param {Object} args
     * @param {string} args.url Full URL of the analytics server host.
     */
    constructor({ url }) {
        this._host = url + SendToServer.API_PATH

        // Schedule sending of network req when user is idle or locks screen
        idleManager.scheduleIdleCbs({
            onIdle: this._sendBulkReq,
            onLocked: this._sendBulkReq,
        })
    }

    get defaultParams() {
        return {
            user_id: 123,
        }
    }

    /**
     * @param {any} [params={}] Any optional piwik HTTP params.
     * @returns {URLSearchParams}
     */
    _formReqParams(params = {}) {
        const searchParams = new URLSearchParams()

        params = { ...this.defaultParams, ...params }
        for (const prop in params) {
            if (params[prop] != null) {
                searchParams.set(prop, params[prop])
            }
        }

        return searchParams
    }

    _serializePoolReqs = () =>
        [...this._pool].map(params => `?${params.toString()}`)

    _poolReq = params => this._pool.add(this._formReqParams(params))

    /**
     * Send a request to the Redash HTTP Tracking API. Takes care of calculating all default
     * or easily derivable params, merging them with input `params`.
     *
     * @param {any} params
     * @return {Promise<Response>}
     */
    _sendReq = params =>
        fetch(this._host, {
            method: 'POST',
            body: this._formReqParams(params),
        })

    /**
     * Send a bulk request to the Piwik HTTP Tracking API. Batches all pooled requests, then resets them.
     *
     * @throws Any network errors.
     * @return {Promise<boolean>}
     */
    _sendBulkReq = async () => {
        if (!this._pool.size || !await this.shouldTrack()) {
            this._pool.clear() // Clear pool if user turned off tracking
            return
        }

        const res = await fetch(this._host, {
            method: 'POST',
            header: SendToServer.JSON_HEADER,
            body: JSON.stringify({ requests: this._serializePoolReqs() }),
        })

        if (res.ok) {
            this._pool.clear()
        }
    }

    async shouldTrack() {
        const storage = await browser.storage.local.get({
            [SHOULD_TRACK]: true,
        })

        return storage[SHOULD_TRACK]
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} event
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent(event, force = false) {
        console.log(event)
        // if (!await this.shouldTrack()) {
        //     return
        // }

        // if (force) {
        //     await this._sendReq(event)
        // } else {
        //     this._poolReq(event)
        // }
    }
}

export default SendToServer
