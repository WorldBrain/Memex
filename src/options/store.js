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
import { reducer as sidebar } from 'src/sidebar-overlay/sidebar'
import { reducer as deleteConfModal } from '../overview/delete-confirm-modal'
import { reducer as results } from '../overview/results'
import { reducer as searchBar } from '../overview/search-bar'
import { reducer as tooltips } from '../overview/tooltips'
import { reducer as customLists } from 'src/custom-lists'
// Search filters in the sidebar
import { reducer as searchFilters } from 'src/search-filters'
import { reducer as sidebarLeft } from 'src/overview/sidebar-left'

import * as notifications from '../notifications'
import { authReducer } from '../authentication/redux'

const rootReducer = combineReducers({
    auth: authReducer,
    blacklist: blacklist.reducer,
    imports: imports.reducer,
    privacy: privacy.reducer,
    settings: settings.reducer,
    onboarding,
    sidebar,
    customLists,
    searchFilters,
    sidebarLeft,
    notifications: notifications.reducer,
    deleteConfModal,
    searchBar,
    tooltips,
    results,
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

    initSentry({ reduxMiddlewares: middlewares, stateTransformer })

    const enhancers = [
        overviewPage.enhancer,
        imports.enhancer,
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
