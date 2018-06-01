import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'
import thunk from 'redux-thunk'

import initSentry from '../util/raven'
import * as imports from './imports'
import * as blacklist from './blacklist'
import * as privacy from './privacy'
import * as settings from './settings'
import * as overviewPage from '../overview'
import { reducer as onboarding } from '../overview/onboarding'
import { reducer as filters } from '../overview/filters'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
    imports: imports.reducer,
    privacy: privacy.reducer,
    overview: overviewPage.reducer,
    settings: settings.reducer,
    onboarding,
    filters,
})

const rootEpic = combineEpics(...Object.values(overviewPage.epics))

/**
 * Used to transform the redux state before sending to raven, filtering out
 * anything we don't need to know.
 */
const stateTransformer = ({ overview, ...state }) => ({
    ...state,
    overview: {
        ...overview,
        searchResult: {
            ...overview.searchResult,
            // Filter out personal stuff from results; not really useful for our knowledge
            docs: overview.searchResult.docs.map(
                ({ url, title, favIcon, screenshot, ...doc }) => doc,
            ),
        },
    },
})

export default function configureStore({ ReduxDevTools = undefined } = {}) {
    const middlewares = [createEpicMiddleware(rootEpic), thunk]

    initSentry(middlewares, stateTransformer)

    const enhancers = [
        overviewPage.enhancer,
        imports.enhancer,
        privacy.enhancer,
        settings.enhancer,
        applyMiddleware(...middlewares),
    ]

    if (ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }

    const enhancer = compose(...enhancers)

    return createStore(
        rootReducer,
        undefined, // Initial State
        enhancer,
    )
}
