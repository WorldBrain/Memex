import { idleManager } from 'src/util/idle'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'

class SendToServer {
    static API_PATH = '/event'

    /**
     * Pool of requests that have been tracked, which will be periodically cleared and sent off in bulk.
     */
    _pool = []

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

    /**
     * Get user id *
     */
    get getUserId() {
        const userId = 123
        return userId
    }

    /**
     *
     * @param {params} params if params is there, then send request directly without wait, otherwise send pool request
     */
    _formReqParams(params = undefined) {
        const data = {
            id: this.getUserId,
            data: params ? [...params] : [...this._pool],
        }

        return data
    }

    _poolReq = params => this._pool.push(params)

    /**
     * Send a request to the Redash HTTP Tracking API. Takes care of calculating all default
     * or easily derivable params, merging them with input `params`.
     *
     * @param {any} params
     * @return {Promise<Response>}
     */
    _sendReq = event => {
        fetch(this._host, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this._formReqParams(event)),
        })
    }

    /**
     * Send a bulk request to the Piwik HTTP Tracking API. Batches all pooled requests, then resets them.
     *
     * @throws Any network errors.
     * @return {Promise<boolean>}
     */
    _sendBulkReq = async () => {
        if (!this._pool.length || !(await this.shouldTrack())) {
            this._pool.length = 0 // Clear pool if user turned off tracking
            return
        }

        const res = await fetch(this._host, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this._formReqParams()),
        })

        if (res.status) {
            this._pool.length = 0
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
        if (!(await this.shouldTrack())) {
            return
        }

        if (force) {
            await this._sendReq(event)
        } else {
            this._poolReq(event)
        }
    }
}

export default SendToServer
