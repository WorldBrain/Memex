import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'

import ErrorBoundary from 'src/common-ui/components/ErrorBoundary'
import RuntimeError from 'src/common-ui/components/RuntimeError'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import configureStore from './store'
import Router from './router.jsx'
import routes from './routes'
import { ModalsContainer } from '../overview/modals/components/ModalsContainer'
import { AuthContextProvider } from 'src/authentication/components/AuthContextProvider'
import { OverlayContainer } from '@worldbrain/memex-common/ts/main-ui/containers/overlay'
import { setupRpcConnection } from 'src/util/webextensionRPC'
import { createUIServices } from 'src/services/ui'
import { UIServices } from 'src/services/ui/types'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/ts/common-ui/styles/types'

// Include development tools if we are not building for production

async function main() {
    const ReduxDevTools = undefined

    setupRpcConnection({
        browserAPIs: chrome,
        sideName: 'extension-page-options',
        role: 'content',
    })

    const store = configureStore({ ReduxDevTools })

    ;(window as any).store = store

    const routeData = {
        services: createUIServices(),
    }

    const root = createRoot(document.getElementById('app')!)
    root.render(
        <Root
            store={store}
            routeData={routeData}
            ReduxDevTools={ReduxDevTools}
        />,
    )
}

interface RootProps {
    store: any
    routeData: {
        services: UIServices
    }
    ReduxDevTools: any
}

interface RootState {
    themeVariant?: MemexThemeVariant
    theme?: MemexTheme
}

class Root extends React.Component<RootProps, RootState> {
    state: RootState = {}

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })

        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName !== 'local') {
                return
            }

            if (changes.themeVariant) {
                const { themeVariant } =
                    await chrome.storage.local.get('themeVariant')

                this.setState({
                    themeVariant,
                    theme: theme({ variant: themeVariant }),
                })
            }
        })
    }

    render() {
        const { props } = this
        const { ReduxDevTools } = props
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }

        return (
            <Provider store={props.store}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <ErrorBoundary component={RuntimeError}>
                        <AuthContextProvider>
                            <OverlayContainer
                                services={props.routeData.services}
                            />
                            <Router
                                routes={routes}
                                routeData={props.routeData}
                                themeVariant={themeVariant}
                            />
                            {props.ReduxDevTools && <ReduxDevTools />}
                            <ModalsContainer />
                        </AuthContextProvider>
                    </ErrorBoundary>
                </ThemeProvider>
            </Provider>
        )
    }
}

main()
