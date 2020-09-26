import 'core-js'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import ErrorBoundary from 'src/common-ui/components/ErrorBoundary'
import RuntimeError from 'src/common-ui/components/RuntimeError'
import Popup from './container'
import configureStore from './store'

const store = configureStore()

ReactDOM.render(
    <Provider store={store}>
        <ErrorBoundary component={RuntimeError}>
            <Popup />
        </ErrorBoundary>
    </Provider>,
    document.getElementById('app'),
)
