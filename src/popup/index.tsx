import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'
import browser from 'webextension-polyfill'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import ErrorBoundary from 'src/common-ui/components/ErrorBoundary'
import RuntimeError from 'src/common-ui/components/RuntimeError'
import Popup from './container'
import configureStore from './store'
import { setupRpcConnection } from 'src/util/webextensionRPC'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

interface RootProps {
    store: ReturnType<typeof configureStore>
    getRootElement: () => HTMLElement
}

interface RootState {
    themeVariant?: MemexThemeVariant
}

class Root extends React.Component<RootProps, RootState> {
    state: RootState = {}

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    render() {
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }
        return (
            <Provider store={this.props.store}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <ErrorBoundary component={RuntimeError}>
                        <Popup
                            getRootElement={this.props.getRootElement}
                            analyticsBG={null}
                        />
                    </ErrorBoundary>
                </ThemeProvider>
            </Provider>
        )
    }
}

function main() {
    setupRpcConnection({
        browserAPIs: browser,
        sideName: 'content-script-popup',
        role: 'content',
    })

    const store = configureStore()

    document.getElementById('loader').remove()

    ReactDOM.render(
        <Root
            getRootElement={() => document.getElementById('body')}
            store={store}
        />,
        document.getElementById('app'),
    )
}

main()
