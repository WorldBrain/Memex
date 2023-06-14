import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import RibbonHolder from './containers/ribbon-holder'
import type { RibbonHolderDependencies } from './containers/ribbon-holder/logic'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

interface RootProps {
    mount: InPageUIRootMount
    deps: RibbonHolderDependencies
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
        const { props } = this

        return (
            <StyleSheetManager target={props.mount.shadowRoot as any}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <RibbonHolder {...props.deps} />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export function setupRibbonUI(
    mount: InPageUIRootMount,
    deps: RibbonHolderDependencies,
) {
    ReactDOM.render(<Root mount={mount} deps={deps} />, mount.rootElement)
}

export function destroyRibbonUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
