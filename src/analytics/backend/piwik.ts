/* eslint no-console: 0 */
import { idleManager } from 'src/util/idle'
import randomString from 'src/util/random-string'
import { shouldTrack } from '../utils'
import { AnalyticsBackend } from './types'
import { AnalyticsTrackEventOptions } from '../types'

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

const JSON_HEADERS = {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
}

export default class PiwikAnalyticsBackend implements AnalyticsBackend {
    static API_PATH = '/piwik.php'
    static DEF_TRACKING = true

    /**
     * @property {Set<URLSearchParam>} Pool of requests that have been tracked, which will be
     *  periodically cleared and sent off in bulk.
     */
    _pool = new Set()
    _siteId: any
    _host: any

    /**
     * @param {Object} args
     * @param {string} args.url Full URL of the analytics server host.
     * @param {string} args.siteId Piwik site ID for the site to track.
     */
    constructor({ url, siteId }) {
        this._siteId = siteId
        this._host = url + PiwikAnalyticsBackend.API_PATH

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
        if (
            !this._pool.size ||
            !(await shouldTrack(PiwikAnalyticsBackend.DEF_TRACKING))
        ) {
            this._pool.clear() // Clear pool if user turned off tracking
            return
        }

        const res = await fetch(this._host, {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({ requests: this._serializePoolReqs() }),
        })

        if (res.ok) {
            this._pool.clear()
        }
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent(eventArgs, options: AnalyticsTrackEventOptions) {
        const params = {
            e_c: eventArgs.category,
            e_a: eventArgs.action,
            e_n: eventArgs.name,
            e_v: eventArgs.value,
        }

        if (options.waitForCompletion) {
            await this._sendReq(params).catch(console.error)
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
        if (!(await this._shouldTrack())) {
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
        if (!(await this._shouldTrack())) {
            return
        }

        return this._poolReq({ action_name: encodeURIComponent(title) })
    }

    async _shouldTrack() {
        return shouldTrack(PiwikAnalyticsBackend.DEF_TRACKING)
    }
}
