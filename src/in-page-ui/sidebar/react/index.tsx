import * as React from 'react'
import * as ReactDOM from 'react-dom'
import SidebarContainer from './containers/sidebar'
import { SidebarContainerDependencies } from './containers/sidebar/types'
import { SidebarEnv } from './types'
import { SidebarController } from '..'

export function setupSidebarUI(
    target: HTMLElement,
    dependencies: SidebarContainerDependencies,
    options: { env: SidebarEnv },
) {
    ReactDOM.render(<SidebarContainer {...options} {...dependencies} />, target)
}

export function destroySidebarUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
