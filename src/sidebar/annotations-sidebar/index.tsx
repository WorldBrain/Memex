import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import {
    Props as AnnotationsSidebarDependencies,
    AnnotationsSidebarInPage as AnnotationsSidebar,
} from './containers/AnnotationsSidebarInPage'

export function setupInPageSidebarUI(
    target: HTMLElement,
    dependencies: AnnotationsSidebarDependencies,
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <AnnotationsSidebar {...dependencies} env="inpage" />
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
