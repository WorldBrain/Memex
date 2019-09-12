import React from 'react'
import { connect } from 'react-redux'
import { browser, Storage } from 'webextension-polyfill-ts'

import * as acts from '../actions'
import * as selectors from '../selectors'
import { defaultState as defs } from '../reducer'
import { STORAGE_KEYS as KEYS } from '../constants'
import IndexingPrefs, { Props as IndexingPrefsProps } from './IndexingPrefs'

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
        const storedVals = await this.props.storage.get(Object.values(KEYS))

        // Set default values if nothing present
        for (const key in storedVals) {
            if (storedVals[key] == null) {
                storedVals[key] = defs[key]
            }
        }

        this.props.initLinks(storedVals[KEYS.BOOKMARKS])
        this.props.initStubs(storedVals[KEYS.STUBS])
        this.props.initVisits(storedVals[KEYS.VISITS])
        this.props.initBookmarks(storedVals[KEYS.BOOKMARKS])
        this.props.initScreenshots(storedVals[KEYS.SCREENSHOTS])
        this.props.initVisitDelay(storedVals[KEYS.VISIT_DELAY])
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
    initBookmarks: val => dispatch(acts.initBookmarks(val)),
    initLinks: val => dispatch(acts.initLinks(val)),
    initStubs: val => dispatch(acts.initStubs(val)),
    initScreenshots: val => dispatch(acts.initScreenshots(val)),
    initVisits: val => dispatch(acts.initVisits(val)),
    initVisitDelay: val => dispatch(acts.initVisitDelay(val)),
    toggleBookmarks: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleBookmarks())
            return browser.storage.local.set({
                [KEYS.BOOKMARKS]: !state.bookmarks,
            })
        }),
    toggleLinks: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleLinks())
            return browser.storage.local.set({
                [KEYS.LINKS]: !state.memexLinks,
            })
        }),
    toggleStubs: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleStubs())
            return browser.storage.local.set({
                [KEYS.STUBS]: !state.stubs,
            })
        }),
    toggleScreenshots: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleScreenshots())
            return browser.storage.local.set({
                [KEYS.SCREENSHOTS]: !state.screenshots,
            })
        }),
    toggleVisits: () =>
        dispatch((_, getState) => {
            const state = getState()
            dispatch(acts.toggleVisits())
            return browser.storage.local.set({
                [KEYS.VISITS]: !state.visits,
            })
        }),
    handleVisitDelayChange: ev => {
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
