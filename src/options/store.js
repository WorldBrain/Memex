import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import initSentry from '../util/raven'
import * as imports from './imports'
import * as blacklist from './blacklist'
import * as settings from './settings'
import { reducer as onboarding } from '../overview/onboarding'
import { reducer as deleteConfModal } from '../overview/delete-confirm-modal'
import { reducer as results } from '../overview/results'
import { reducer as searchBar } from '../overview/search-bar'
import { reducer as tooltips } from '../overview/tooltips'
import { reducer as customLists } from 'src/custom-lists'
import { reducer as modals } from '../overview/modals/reducer'
// Search filters in the sidebar
import { reducer as searchFilters } from 'src/search-filters'
import { reducer as sidebar } from 'src/sidebar-overlay/sidebar'

import * as notifications from '../notifications'
import { authReducer } from '../authentication/redux'

const rootReducer = combineReducers({
    auth: authReducer,
    blacklist: blacklist.reducer,
    imports: imports.reducer,
    settings: settings.reducer,
    onboarding,
    customLists,
    searchFilters,
    sidebar,
    notifications: notifications.reducer,
    deleteConfModal,
    modals,
    searchBar,
    tooltips,
    results,
})

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
    const middlewares = [thunk]

    initSentry({ reduxMiddlewares: middlewares, stateTransformer })

    const enhancers = [imports.enhancer, applyMiddleware(...middlewares)]

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
