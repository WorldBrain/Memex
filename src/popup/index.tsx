import 'core-js'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'

import { theme } from 'src/common-ui/components/design-library/theme'
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
        <ThemeProvider theme={theme}>
            <ErrorBoundary component={RuntimeError}>
                <Popup />
            </ErrorBoundary>
        </ThemeProvider>
    </Provider>,
    document.getElementById('app'),
)
