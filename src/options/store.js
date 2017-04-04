import { createStore, combineReducers } from 'redux'

import settingsReducer from './containers/settings/reducer';

const rootReducer = combineReducers({
    settings: settingsReducer
})

export default function configureStore({ReduxDevTools=undefined}={}) {
    return createStore(
        rootReducer,
        undefined, // Initial State
        ReduxDevTools && ReduxDevTools.instrument()
    )
}
