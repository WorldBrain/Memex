import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router'
import { Provider } from 'react-redux'

import configureStore from './store'
import Layout from './layout'
import Routes from './routes'

// Include development tools if we are not building for production
let ReduxDevTools = undefined
if (process.env.NODE_ENV !== 'production') {
    ReduxDevTools = require('src/dev/redux-devtools-component').default
}

const store = configureStore({ReduxDevTools})

ReactDOM.render(
    <Provider store={store}>
        <Router history={hashHistory}>
            <Route path='/' component={Layout}>
                <IndexRedirect to='/settings' />
                { Routes.map(route =>
                    <Route
                        key={route.pathname}
                        path={route.pathname}
                        component={route.component}
                    />
                )}
            </Route>
        </Router>
    </Provider>,
    document.getElementById('app')
)
