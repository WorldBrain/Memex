import { idleManager } from 'src/util/idle'
import { shouldTrack, generateUserId } from '../../utils'

class SendToServer {
    static DEF_TRACKING = true
    static API_PATH = '/event'
    static JSON_HEADER = {
        Accept: 'application/json',
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

    /**
     *
     * @param {params} params if params is there, then send request directly without wait, otherwise send pool request
     */
    static _serializePoolReqs(userId, events) {
        const data = {
            id: userId,
            data: [...events],
        }

        return JSON.stringify(data)
    }

    _poolReq = params => this._pool.add(params)

    /**
     * Send a request to the Redash HTTP Tracking API. Takes care of calculating all default
     * or easily derivable params, merging them with input `params`.
     *
     * @param {any} params
     * @return {Promise<Response>}
     */
    _sendReq = async event => {
        if (!(await shouldTrack(SendToServer.DEF_TRACKING))) {
            return
        }

        const userId = await generateUserId({})

        if (!userId) {
            return
        }

        return fetch(this._host, {
            method: 'POST',
            headers: SendToServer.JSON_HEADER,
            body: SendToServer._serializePoolReqs(userId, [{ ...event }]),
        })
    }

    /**
     * Send a bulk request to the AWS Tracking API. Batches all pooled requests, then resets them.
     *
     * @throws Any network errors.
     * @return {Promise<boolean>}
     */
    _sendBulkReq = async () => {
        if (
            !this._pool.size ||
            !(await shouldTrack(SendToServer.DEF_TRACKING))
        ) {
            this._pool.clear() // Clear pool if user turned off tracking
            return
        }

        const userId = await generateUserId({})

        if (!userId) {
            return
        }

        const res = await fetch(this._host, {
            method: 'POST',
            headers: SendToServer.JSON_HEADER,
            body: SendToServer._serializePoolReqs(userId, this._pool),
        })

        if (res.ok) {
            this._pool.clear()
        }
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} event
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent(event, force = false) {
        if (!(await shouldTrack(SendToServer.DEF_TRACKING))) {
            return
        }

        if (force) {
            await this._sendReq(event).catch(console.error)
        } else {
            this._poolReq(event)
        }
    }
}

export default SendToServer
