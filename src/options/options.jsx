import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRedirect, hashHistory } from 'react-router'
import { Provider } from 'react-redux'
import Raven from 'raven-js'

import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import { withPageTracking } from 'src/common-ui/hocs'
import configureStore from './store'
import Layout from './layout'
import Routes from './routes'

// Include development tools if we are not building for production
const ReduxDevTools =
    process.env.NODE_ENV !== 'production'
        ? require('src/dev/redux-devtools-component').default
        : undefined

// Set up the sentry runtime error config
Raven.config(process.env.SENTRY_DSN).install()

const store = configureStore({ ReduxDevTools })

ReactDOM.render(
    <Provider store={store}>
        <ErrorBoundary component={RuntimeError}>
            <Router history={hashHistory}>
                <Route path="/" component={withPageTracking(Layout)}>
                    <IndexRedirect to="/blacklist" />
                    {Routes.map(route => (
                        <Route
                            key={route.pathname}
                            path={route.pathname}
                            component={route.component}
                        />
                    ))}
                </Route>
            </Router>
        </ErrorBoundary>
    </Provider>,
    document.getElementById('app'),
)
