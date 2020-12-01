import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import { theme } from 'src/common-ui/components/design-library/theme'
import RibbonHolder from './containers/ribbon-holder'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from './containers/ribbon/types'

export function setupRibbonUI(
    target: HTMLElement,
    options: {
        inPageUI: SharedInPageUIInterface
        containerDependencies: RibbonContainerDependencies
    },
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <ThemeProvider theme={theme}>
                <RibbonHolder {...options} />
            </ThemeProvider>
        </StyleSheetManager>,
        target,
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
