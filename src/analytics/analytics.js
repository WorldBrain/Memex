import { idleManager } from 'src/util/idle'
import randomString from 'src/util/random-string'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'

/**
 * @typedef {Object} EventTrackInfo
 * @property {string} category The event category ('Search', 'Blacklist', etc.).
 * @property {string} action The event action ('Add Entry', etc.).
 * @property {string} [name] The optional event name (user input - other custom info).
 * @property {number} [value] The optional event value (should be numeric).
 */

/**
 * @typedef {Object} LinkTrackInfo
 * @property {string} url The full URL being linked to.
 * @property {'link'|'download'} [linkType='link'] Signifies if link is to a page or download.
 */

class Analytics {
    static API_PATH = '/piwik.php'
    static JSON_HEADERS = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
    }

    /**
     * @property {Set<URLSearchParam>} Pool of requests that have been tracked, which will be
     *  periodically cleared and sent off in bulk.
     */
    _pool = new Set()

    /**
     * @param {Object} args
     * @param {string} args.url Full URL of the analytics server host.
     * @param {string} args.siteId Piwik site ID for the site to track.
     */
    constructor({ url, siteId }) {
        this._siteId = siteId
        this._host = url + Analytics.API_PATH

        // Schedule sending of network req when user is idle or locks screen
        idleManager.scheduleIdleCbs({
            onIdle: this._sendBulkReq,
            onLocked: this._sendBulkReq,
        })
    }

    get defaultParams() {
        const now = new Date()
        return {
            idsite: this._siteId,
            url: window.location.href,
            rec: 1,
            rand: randomString(),
            res: `${window.screen.width}x${window.screen.height}`,
            h: now.getHours(),
            m: now.getMinutes(),
            s: now.getSeconds(),
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
     * Send a request to the Piwik HTTP Tracking API. Takes care of calculating all default
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
            header: Analytics.JSON_HEADER,
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
     * @param {EventTrackInfo} eventArgs
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent(eventArgs, force = false) {
        if (!await this.shouldTrack()) {
            return
        }

        const params = {
            e_c: eventArgs.category,
            e_a: eventArgs.action,
            e_n: eventArgs.name,
            e_v: eventArgs.value,
        }

        if (force) {
            await this._sendReq(params)
        } else {
            this._poolReq(params)
        }
    }

    /**
     * Track user link clicks.
     *
     * @param {LinkTrackInfo} linkArgs
     */
    async trackLink({ linkType, url }) {
        if (!await this.shouldTrack()) {
            return
        }

        const params = linkType === 'link' ? { link: url } : { download: url }
        return this._poolReq({ ...params, url })
    }

    /**
     * Track user page visits.
     *
     * @param {string} args.title The title of the page to track
     */
    async trackPage({ title }) {
        if (!await this.shouldTrack()) {
            return
        }

        return this._poolReq({ action_name: encodeURIComponent(title) })
    }
}

export default Analytics
