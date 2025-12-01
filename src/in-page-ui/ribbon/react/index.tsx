import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import RibbonHolder from './containers/ribbon-holder'
import type { RibbonHolderDependencies } from './containers/ribbon-holder/logic'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/ts/common-ui/styles/types'

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

        await chrome.storage.onChanged.addListener(
            async (changes, areaName) => {
                if (areaName !== 'local') {
                    return
                }

                if (changes.themeVariant) {
                    const { themeVariant } =
                        await chrome.storage.local.get('themeVariant')

                    this.setState({
                        themeVariant: themeVariant,
                    })
                }
            },
        )
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
                    <RibbonHolder
                        theme={themeVariant}
                        getRootElement={() => props.mount.rootElement}
                        {...props.deps}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export function setupRibbonUI(
    mount: InPageUIRootMount,
    deps: RibbonHolderDependencies,
) {
    const root = createRoot(mount.rootElement)
    root.render(<Root mount={mount} deps={deps} />)
    return root
}

export function destroyRibbonUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    // ReactDOM.unmountComponentAtNode(target) // Handled by caller

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
