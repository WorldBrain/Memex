import 'babel-polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import { ErrorBoundary, RuntimeError } from '../common-ui/components'
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
