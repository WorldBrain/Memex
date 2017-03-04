import { createStore, combineReducers, compose} from 'redux'
import { persistentStore } from 'redux-pouchdb'
import db from '../pouchdb'

import settingsReducer from './containers/settings/reducer';

const rootReducer = combineReducers({
    settings: settingsReducer
})

export default function configureStore({ReduxDevTools=undefined}={}) {
    const enhancers = [
        persistentStore(db)
    ]

    if(ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }

    return createStore(
        rootReducer,
        undefined, // Initial State
        compose(...enhancers)
    )
}
