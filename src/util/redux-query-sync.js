import createHistory from 'history/createBrowserHistory'

// Helps to keep configured query parameters of the window location in sync
// (bidirectionally) with values in the Redux store.
function ReduxQuerySync({
    store,
    params,
    replaceState,
    initialTruth,
}) {
    const { dispatch } = store

    const history = createHistory()

    const updateLocation = replaceState
        ? history.replace.bind(history)
        : history.push.bind(history)

    // A bit of state used to not respond to self-induced location updates.
    let ignoreLocationUpdate = false

    // Keeps the last seen values for comparing what has changed.
    let lastQueryValues = {}

    function getQueryValues(location) {
        const locationParams = new URL('http://bogus' + location.search).searchParams
        const queryValues = {}
        Object.keys(params).forEach(param => {
            const { defaultValue } = params[param]
            let value = locationParams.get(param)
            if (value === null) {
                value = defaultValue
            }
            queryValues[param] = value
        })
        return queryValues
    }

    function handleLocationUpdate(location) {
        // Ignore the event if the location update was induced by ourselves.
        if (ignoreLocationUpdate) return

        const state = store.getState()

        // Read the values of the watched parameters
        const queryValues = getQueryValues(location)

        // For each parameter value that changed, call the corresponding action.
        Object.keys(queryValues).forEach(param => {
            const value = queryValues[param]
            if (value !== lastQueryValues[param]) {
                const { selector, action } = params[param]
                lastQueryValues[param] = value

                // Dispatch the action to update the state if needed.
                // (except on initialisation, this should always be needed)
                if (selector(state) !== value) {
                    dispatch(action(value))
                }
            }
        })
    }

    function handleStateUpdate() {
        const state = store.getState()
        const location = history.location

        // Parse the current location's query string.
        const locationParams = new URL('http://bogus' + location.search).searchParams

        // Replace each configured parameter with its value in the state.
        Object.keys(params).forEach(param => {
            const { selector, defaultValue } = params[param]
            const value = selector(state)
            if (value === defaultValue) {
                locationParams.delete(param)
            } else {
                locationParams.set(param, value)
            }
        })
        const newLocationSearchString = `?${locationParams}`

        // Only update location if anything changed.
        if (newLocationSearchString !== location.search) {
            // Update location (but prevent triggering a state update).
            ignoreLocationUpdate = true
            updateLocation({search: newLocationSearchString})
            ignoreLocationUpdate = false
        }
    }

    // Sync location to store on every location change, and vice versa.
    const unsubscribeFromLocation = history.listen(handleLocationUpdate)
    const unsubscribeFromStore = store.subscribe(handleStateUpdate)

    // Sync location to store now, or vice versa, or neither.
    if (initialTruth === 'location') {
        handleLocationUpdate(history.location)
    } else {
        // Just set the last seen values to later compare what changed.
        lastQueryValues = getQueryValues(history.location)
    }
    if (initialTruth === 'store') {
        handleStateUpdate()
    }

    return function unsubscribe() {
        unsubscribeFromLocation()
        unsubscribeFromStore()
    }
}

// Also offer the function as a store enhancer for convenience.
function makeStoreEnhancer(config) {
    return storeCreator => (reducer, initialState, enhancer) => {
        // Create the store as usual.
        const store = storeCreator(reducer, initialState, enhancer)

        // Hook up our listeners.
        ReduxQuerySync({store, ...config})

        return store
    }
}

ReduxQuerySync.enhancer = makeStoreEnhancer

export default ReduxQuerySync
