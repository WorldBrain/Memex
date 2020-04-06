import * as React from 'react'
import * as ReactDOM from 'react-dom'
import SidebarContainer from './containers/sidebar'
import { SidebarControllerEventEmitter } from '../types'

export function setupSidebarUI(
    target: HTMLElement,
    options: {
        sidebarEvents: SidebarControllerEventEmitter
    },
) {
    // ReactDOM.render(<SidebarContainer {...options} />, target)
}

export function destroySidebarUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
