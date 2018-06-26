import { idleManager } from 'src/util/idle'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'
import { USER_ID, generateTokenIfNot } from 'src/util/generate-token'
import { installTimeStorageKey } from 'src/imports/background'

class SendToServer {
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
    async _serializePoolReqs(param = undefined) {
        const userId = await this.userId()

        const data = {
            id: userId,
            data: param ? [{ ...param }] : [...this._pool],
        }

        return data
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
        fetch(this._host, {
            method: 'POST',
            headers: SendToServer.JSON_HEADER,
            body: JSON.stringify(await this._serializePoolReqs(event)),
        })
    }

    /**
     * Send a bulk request to the Piwik HTTP Tracking API. Batches all pooled requests, then resets them.
     *
     * @throws Any network errors.
     * @return {Promise<boolean>}
     */
    _sendBulkReq = async () => {
        if (!this._pool.size || !(await this.shouldTrack())) {
            this._pool.clear() // Clear pool if user turned off tracking
            return
        }

        const res = await fetch(this._host, {
            method: 'POST',
            headers: SendToServer.JSON_HEADER,
            body: JSON.stringify(await this._serializePoolReqs()),
        })

        if (res.ok) {
            this._pool.clear()
        }
    }

    async userId() {
        let userId = (await browser.storage.local.get(USER_ID))[USER_ID]

        while (!userId) {
            const installTime = (await browser.storage.local.get(
                installTimeStorageKey,
            ))[installTimeStorageKey]
            userId = await generateTokenIfNot(installTime)
        }

        return userId
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
            await this._sendReq(event).catch(console.error)
        } else {
            this._poolReq(event)
        }
    }
}

export default SendToServer
