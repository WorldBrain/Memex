import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import {
    AnnotationSidebarInPage,
    Props as SidebarContainerDependencies,
} from './containers/AnnotationsSidebarInPage'

export function setupInPageSidebarUI(
    target: HTMLElement,
    dependencies: SidebarContainerDependencies,
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <AnnotationSidebarInPage {...dependencies} env="inpage" />
        </StyleSheetManager>,
        target,
    )
}

export function destroyInPageSidebarUI(
    target: HTMLElement,
    shadowRoot?: ShadowRoot,
) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
