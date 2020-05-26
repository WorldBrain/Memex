import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import RibbonHolder from './containers/ribbon-holder'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RibbonContainerDependencies } from './containers/ribbon/types'

export function setupRibbonUI(
    target: HTMLElement,
    options: {
        inPageUI: InPageUIInterface
        containerDependencies: RibbonContainerDependencies
    },
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <RibbonHolder {...options} />
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
