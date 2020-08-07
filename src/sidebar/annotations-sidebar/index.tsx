import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

import {
    AnnotationsSidebarInPage,
    Props as AnnotationsSidebarDependencies,
} from './containers/AnnotationsSidebarInPage'

export function setupInPageSidebarUI(
    target: HTMLElement,
    dependencies: AnnotationsSidebarDependencies,
) {
    ReactDOM.render(
        <StyleSheetManager target={target}>
            <AnnotationsSidebarInPage {...dependencies} />
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
