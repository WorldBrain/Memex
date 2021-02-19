import 'core-js'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import ErrorBoundary from 'src/common-ui/components/ErrorBoundary'
import RuntimeError from 'src/common-ui/components/RuntimeError'
import Popup from './container'
import configureStore from './store'
import { setupRpcConnection } from 'src/util/webextensionRPC'

setupRpcConnection({ sideName: 'content-script-popup', role: 'content' })

const store = configureStore()

document.getElementById('loader').remove()

ReactDOM.render(
    <Provider store={store}>
        <ErrorBoundary component={RuntimeError}>
            <Popup />
        </ErrorBoundary>
    </Provider>,
    document.getElementById('app'),
)
