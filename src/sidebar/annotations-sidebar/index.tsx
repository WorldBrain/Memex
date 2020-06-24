import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import SidebarContainer from './containers/sidebar-annotations'
import { SidebarContainerDependencies } from './containers/sidebar-annotations/types'
import { SidebarEnv } from './types'

export function setupSidebarUI(
    target: HTMLElement,
    dependencies: SidebarContainerDependencies,
    options: { env: SidebarEnv },
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <SidebarContainer {...options} {...dependencies} />
        </StyleSheetManager>,
        target,
    )
}

export function destroySidebarUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
