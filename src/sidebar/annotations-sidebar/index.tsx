import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import { SidebarEnv } from './types'
import { SidebarContainerDependencies } from 'src/sidebar/annotations-sidebar/containers/old/sidebar-annotations/types'
import { SidebarContainer } from 'src/overview/sidebar-left'

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
