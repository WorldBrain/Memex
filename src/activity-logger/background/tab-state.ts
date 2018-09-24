import { browser, Storage } from 'webextension-polyfill-ts'

import PausableTimer from '../../util/pausable-timer'
import { TOOLTIP_STORAGE_NAME } from '../../content-tooltip/constants'
import ScrollState from './scroll-state'
import { TabState, NavState } from './types'
import { remoteFunction } from '../../util/webextensionRPC'
import { isLoggable } from '..'

export interface TabProps extends TabState {
    storageAPI: Storage.Static
}

class Tab implements TabState {
    id: number
    url: string
    isActive: boolean
    isLoaded: boolean
    visitTime: number
    activeTime: number
    lastActivated: number
    scrollState: ScrollState
    navState: NavState
    private _timer: PausableTimer
    private _storageAPI: Storage.Static

    constructor({
        id,
        url,
        isActive = false,
        isLoaded = false,
        visitTime = Date.now(),
        navState = {},
        storageAPI = browser.storage,
    }: Partial<TabProps>) {
        this.id = id
        this.url = url
        this.isActive = isActive
        this.isLoaded = isLoaded
        this.visitTime = visitTime
        this.navState = navState
        this.scrollState = new ScrollState()
        this.activeTime = 0
        this.lastActivated = Date.now()
        this._storageAPI = storageAPI
        this._timer = null
    }

    /**
     * Decides whether or not to send the remote function call to the content script
     * to tell it to toggle rendering the iFrame for the sidebar for the current tab.
     *
     * Should check whether the tab's loading state, loggability, tooltip enabled state.
     */
    private async _toggleRenderSidebarIFrame(shouldRender: boolean) {
        if (!this.isLoaded || !isLoggable({ url: this.url })) {
            return
        }

        const storage = await this._storageAPI.local.get(TOOLTIP_STORAGE_NAME)

        if (!storage[TOOLTIP_STORAGE_NAME]) {
            return
        }

        return remoteFunction('toggleIFrameRender', {
            tabId: this.id,
        })(shouldRender)
    }

    private _pauseLogTimer() {
        if (this._timer != null) {
            this._timer.pause()
        }
    }

    private _resumeLogTimer() {
        if (this._timer != null) {
            this._timer.resume()
        }
    }

    /**
     * Sets up a PausableTimer to run the given log function. This can be stopped, started, or cancelled.
     *
     * @param logCb Logic to schedule to run on this tab later.
     */
    scheduleLog(logCb: () => void | Promise<void>, delay = 0) {
        this.cancelPendingOps()

        // Just run straight away if no delay set
        if (delay === 0) {
            return Promise.resolve(logCb())
        }

        this._timer = new PausableTimer({
            delay,
            cb: logCb,
            start: this.isActive, // Start timer if currently active
        })

        return Promise.resolve()
    }

    /**
     * Updates the active and possibly ongoing timer states either to
     * mark being made active or inactive by the user.
     *
     * @param {number} [now=Date.now()] When the active state changed.
     */
    toggleActiveState(skipRemoteCall = false, now = Date.now()) {
        if (this.isActive) {
            this.activeTime = this.activeTime + now - this.lastActivated
            this._pauseLogTimer()
        } else {
            this.lastActivated = now
            this._resumeLogTimer()
        }

        if (!skipRemoteCall) {
            this._toggleRenderSidebarIFrame(!this.isActive)
        }

        this.isActive = !this.isActive
    }

    setLoadedState(isLoaded: boolean) {
        this.isLoaded = isLoaded
    }

    /**
     * Cancels any scheduled log created from `scheduleLog` calls.
     */
    cancelPendingOps() {
        if (this._timer != null) {
            this._timer.clear()
            this._timer = null
        }
    }
}

export default Tab
