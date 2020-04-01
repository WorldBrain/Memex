import * as React from 'react'
import * as ReactDOM from 'react-dom'
import SidebarController from './controllers/sidebar'
import { SidebarUIControllerEventEmitter } from '../types'

export function setupSidebarUI(
    target: HTMLElement,
    options: {
        sidebarEvents: SidebarUIControllerEventEmitter
    },
) {
    ReactDOM.render(<SidebarController {...options} />, target)
}

export function destroySidebarUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
