import ScrollState from './scroll-state'
import { TabState, NavState } from './types'

class Tab implements TabState {
    url: string
    isActive: boolean
    visitTime: number
    activeTime: number
    lastActivated: number
    scrollState: ScrollState
    navState: NavState

    constructor({
        url,
        isActive = false,
        visitTime = Date.now(),
        navState = {},
    }: Partial<TabState>) {
        this.url = url
        this.isActive = isActive
        this.visitTime = visitTime
        this.navState = navState
        this.scrollState = new ScrollState()
        this.activeTime = 0
        this.lastActivated = Date.now()
    }

    /**
     * Updates the active and possibly ongoing timer states either to
     * mark being made active or inactive by the user.
     *
     * @param [now=Date.now()] When the active state changed.
     */
    toggleActiveState(now = Date.now()) {
        if (this.isActive) {
            this.activeTime = this.activeTime + now - this.lastActivated
        } else {
            this.lastActivated = now
        }

        this.isActive = !this.isActive
    }
}

export default Tab
