import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import { theme } from 'src/common-ui/components/design-library/theme'
import {
    AnnotationsSidebarInPage,
    Props as AnnotationsSidebarDependencies,
} from './containers/AnnotationsSidebarInPage'
import { InPageUIRootMount } from 'src/in-page-ui/types'

export function setupInPageSidebarUI(
    mount: InPageUIRootMount,
    dependencies: AnnotationsSidebarDependencies,
) {
    ReactDOM.render(
        <StyleSheetManager target={mount.shadowRoot as any}>
            <ThemeProvider theme={theme}>
                <AnnotationsSidebarInPage {...dependencies} />
            </ThemeProvider>
        </StyleSheetManager>,
        mount.rootElement,
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
