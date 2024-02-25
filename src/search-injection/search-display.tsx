import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { DashboardDependencies } from 'src/dashboard-refactor/types'
import * as constants from './constants'
import { DashboardContainer } from 'src/dashboard-refactor'
import { InPageSearchModal } from '@worldbrain/memex-common/lib/common-ui/components/inPage-search-modal'
import { RemoteBGScriptInterface } from 'src/background-script/types'

type RootProps = Omit<DashboardDependencies, 'theme' | 'openSpaceInWebUI'> & {
    rootEl: HTMLElement
    bgScriptBG: RemoteBGScriptInterface
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

    removeRoot = (rootEl: HTMLElement) => {
        const unmountResult = ReactDOM.unmountComponentAtNode(rootEl)
        if (unmountResult) {
            rootEl.remove()
        } else {
            console.error('DashboardContainer unmounting failed')
        }
    }

    render() {
        if (!this.state.themeVariant) {
            return null
        }
        const { rootEl, ...props } = this.props
        const memexTheme = theme({ variant: this.state.themeVariant })

        return (
            <StyleSheetManager target={rootEl}>
                <ThemeProvider theme={memexTheme}>
                    <InPageSearchModal
                        closeComponent={() => this.removeRoot(rootEl)}
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
                            closeInPageMode={() => this.removeRoot(rootEl)}
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

export type SearchDisplayProps = Omit<RootProps, 'rootEl' | 'inPageMode'>

export const renderSearchDisplay = (props: SearchDisplayProps): void => {
    const existingRoot = document.getElementById(
        constants.REACT_ROOTS.searchDisplay,
    )
    if (existingRoot) {
        existingRoot.remove()
    }
    const root = document.createElement('div')
    root.setAttribute('id', constants.REACT_ROOTS.searchDisplay)

    const renderComponent = () => {
        document.body.appendChild(root)
        ReactDOM.render(<Root rootEl={root} {...props} />, root)
    }

    renderComponent()
}
