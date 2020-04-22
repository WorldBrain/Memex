import * as React from 'react'
import * as ReactDOM from 'react-dom'
import RibbonHolder from './containers/ribbon-holder'
import { RibbonController } from '..'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { RibbonContainerDependencies } from './containers/ribbon/types'

export function setupRibbonUI(
    target: HTMLElement,
    options: {
        inPageUI: InPageUI
        ribbonController: RibbonController
        containerDependencies: RibbonContainerDependencies
    },
) {
    ReactDOM.render(<RibbonHolder {...options} />, target)
}

export function destroyRibbonUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
