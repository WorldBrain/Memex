import * as actions from './actions'
import * as selectors from './selectors'
import * as consts from './constants'

const sync = store =>
    store.subscribe(() => {
        const shouldTrackState = selectors.shouldTrack(store.getState())

        // Update persisted shouldTrack value in Storage, if it's changed
        browser.storage.local
            .get(consts.SHOULD_TRACK_STORAGE_KEY)
            .then(data => {
                if (
                    data[consts.SHOULD_TRACK_STORAGE_KEY] !== shouldTrackState
                ) {
                    browser.storage.local.set({
                        [consts.SHOULD_TRACK_STORAGE_KEY]: shouldTrackState,
                    })
                }
            })
            .catch(console.error)
    })

const hydrate = async store => {
    try {
        const {
            [consts.SHOULD_TRACK_STORAGE_KEY]: shouldTrackPersisted,
        } = await browser.storage.local.get({
            [consts.SHOULD_TRACK_STORAGE_KEY]: false,
        })

        store.dispatch(actions.setTrackingFlag(shouldTrackPersisted))
    } catch (error) {
        // Storage access issue; ignore
    }
}

export default storeCreator => (reducer, initState, enhancer) => {
    const store = storeCreator(reducer, initState, enhancer)

    // Subscribe to state changes and update local storage
    sync(store)

    // Rehydrate on init from localStorage
    hydrate(store)

    return store
}
