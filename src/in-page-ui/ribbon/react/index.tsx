import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import { theme } from 'src/common-ui/components/design-library/theme'
import RibbonHolder from './containers/ribbon-holder'
import type { RibbonHolderDependencies } from './containers/ribbon-holder/logic'
import type { InPageUIRootMount } from 'src/in-page-ui/types'

export function setupRibbonUI(
    mount: InPageUIRootMount,
    deps: RibbonHolderDependencies,
) {
    ReactDOM.render(
        <StyleSheetManager target={mount.shadowRoot as any}>
            <ThemeProvider theme={theme}>
                <RibbonHolder {...deps} />
            </ThemeProvider>
        </StyleSheetManager>,
        mount.rootElement,
    )
}

export function destroyRibbonUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
