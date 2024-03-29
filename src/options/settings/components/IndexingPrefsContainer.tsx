import React from 'react'
import { connect } from 'react-redux'
import browser, { Storage } from 'webextension-polyfill'

import * as acts from '../actions'
import * as selectors from '../selectors'
import { defaultState as defs } from '../reducer'
import { STORAGE_KEYS as KEYS } from '../constants'
import IndexingPrefs, { Props as IndexingPrefsProps } from './IndexingPrefs'
import analytics from 'src/analytics'

const trackIndexingSettingChange = () =>
    analytics.trackEvent({
        category: 'Settings',
        action: 'changeIndexingSetting',
    })

export interface Props {
    storage: Storage.LocalStorageArea
    initLinks: (val: boolean) => void
    initStubs: (val: boolean) => void
    initVisits: (val: boolean) => void
    initBookmarks: (val: boolean) => void
    initVisitDelay: (val: number) => void
    initScreenshots: (val: boolean) => void
}

class IndexingPrefsContainer extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        storage: browser.storage.local,
    }

    componentDidMount() {
        this.hydrateStateFromStorage()
    }

    private async hydrateStateFromStorage() {
        const stored = await this.props.storage.get(Object.values(KEYS))

        this.props.initLinks(stored[KEYS.LINKS] ?? defs.memexLinks)
        this.props.initStubs(stored[KEYS.STUBS] ?? defs.stubs)
        this.props.initVisits(stored[KEYS.VISITS] ?? defs.visits)
        this.props.initBookmarks(stored[KEYS.BOOKMARKS] ?? defs.bookmarks)
        this.props.initVisitDelay(stored[KEYS.VISIT_DELAY] ?? defs.visitDelay)
        this.props.initScreenshots(stored[KEYS.SCREENSHOTS] ?? defs.screenshots)
    }

    render() {
        return <IndexingPrefs {...this.props} />
    }
}

const mapStateToProps = (state): Partial<IndexingPrefsProps> => ({
    bookmarks: selectors.bookmarks(state),
    memexLinks: selectors.memexLinks(state),
    stubs: selectors.stubs(state),
    screenshots: selectors.screenshots(state),
    visits: selectors.visits(state),
    visitDelay: selectors.visitDelay(state),
})

const mapDispatchToProps = (
    dispatch,
): Partial<IndexingPrefsProps> & Partial<Props> => ({
    initBookmarks: (val) => dispatch(acts.initBookmarks(val)),
    initLinks: (val) => dispatch(acts.initLinks(val)),
    initStubs: (val) => dispatch(acts.initStubs(val)),
    initScreenshots: (val) => dispatch(acts.initScreenshots(val)),
    initVisits: (val) => dispatch(acts.initVisits(val)),
    initVisitDelay: (val) => dispatch(acts.initVisitDelay(val)),
    toggleBookmarks: () => {
        trackIndexingSettingChange()

        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleBookmarks())
            return browser.storage.local.set({
                [KEYS.BOOKMARKS]: !selectors.bookmarks(state),
            })
        })
    },
    toggleLinks: () => {
        trackIndexingSettingChange()

        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleLinks())
            return browser.storage.local.set({
                [KEYS.LINKS]: !selectors.memexLinks(state),
            })
        })
    },
    toggleStubs: () => {
        trackIndexingSettingChange()

        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleStubs())
            return browser.storage.local.set({
                [KEYS.STUBS]: !selectors.stubs(state),
            })
        })
    },
    toggleScreenshots: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleScreenshots())
            return browser.storage.local.set({
                [KEYS.SCREENSHOTS]: !selectors.screenshots(state),
            })
        }),
    toggleVisits: () => {
        trackIndexingSettingChange()

        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleVisits())
            return browser.storage.local.set({
                [KEYS.VISITS]: !selectors.visits(state),
            })
        })
    },
    handleVisitDelayChange: (ev) => {
        trackIndexingSettingChange()

        const el = ev.target as HTMLInputElement
        dispatch(acts.changeVisitDelay(+el.value))
        return browser.storage.local.set({
            [KEYS.VISIT_DELAY]: +el.value,
        })
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(IndexingPrefsContainer)
