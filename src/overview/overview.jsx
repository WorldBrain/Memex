import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import overview from 'src/overview'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import configureStore from './store'

import './base.css'

// Include development tools if we are not building for production
let ReduxDevTools
if (process.env.NODE_ENV !== 'production') {
    ReduxDevTools = require('src/dev/redux-devtools-component').default
}

// Set up the Redux store
const store = configureStore({ReduxDevTools})

store.dispatch(overview.actions.init())

const { Overview } = overview.components

// Render the UI to the screen
ReactDOM.render(
    <Provider store={store}>
        <ErrorBoundary component={RuntimeError}>
            <Overview grabFocusOnMount />
            {ReduxDevTools && <ReduxDevTools />}
        </ErrorBoundary>
    </Provider>,
    document.getElementById('app')
)
