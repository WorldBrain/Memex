import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { DashboardDependencies } from 'src/dashboard-refactor/types'
import { DashboardContainer } from 'src/dashboard-refactor'
import { InPageSearchModal } from '@worldbrain/memex-common/lib/common-ui/components/inPage-search-modal'
import { createInPageUI } from 'src/in-page-ui/utils'

type RootProps = Omit<DashboardDependencies, 'theme' | 'openSpaceInWebUI'> & {
    rootEl: HTMLElement
    shadowRoot: ShadowRoot
}

interface RootState {
    themeVariant: MemexThemeVariant | null
}

class Root extends React.PureComponent<RootProps, RootState> {
    state: RootState = { themeVariant: null }

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    private removeRoot = () => {
        const unmountResult = ReactDOM.unmountComponentAtNode(this.props.rootEl)
        if (unmountResult) {
            this.props.rootEl.remove()
        }
    }

    render() {
        if (!this.state.themeVariant) {
            return null
        }
        const { rootEl, shadowRoot, ...props } = this.props
        const memexTheme = theme({ variant: this.state.themeVariant })

        return (
            <StyleSheetManager target={shadowRoot as any}>
                <ThemeProvider theme={memexTheme}>
                    <InPageSearchModal
                        closeComponent={this.removeRoot}
                        getPortalRoot={() => rootEl}
                        positioning="centerCenter"
                        blockedBackground
                    >
                        <DashboardContainer
                            {...props}
                            inPageMode
                            theme={memexTheme}
                            getRootElement={() => rootEl}
                            onResultSelect={(exportedResultText) => null}
                            closeInPageMode={this.removeRoot}
                            openSettings={() => {
                                this.props.bgScriptBG.openOptionsTab('settings')
                            }}
                        />
                    </InPageSearchModal>
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export type SearchDisplayProps = Omit<
    RootProps,
    'rootEl' | 'shadowRoot' | 'inPageMode'
>

export const renderSearchDisplay = (props: SearchDisplayProps): void => {
    const { rootElement, shadowRoot } = createInPageUI('search-display')
    ReactDOM.render(
        <Root rootEl={rootElement} shadowRoot={shadowRoot} {...props} />,
        rootElement,
    )
}
