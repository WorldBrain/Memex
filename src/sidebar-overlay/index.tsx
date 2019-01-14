import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarController from './ribbon-sidebar-controller'
import AnnotationsManager from '../sidebar-common/annotations-manager'
import {
    highlightAnnotations,
    highlightAndScroll,
} from './content_script/highlight-interactions'

export const setupRibbonAndSidebarUI = (
    target: HTMLElement,
    {
        annotationsManager,
        handleRemoveRibbon,
    }: {
        annotationsManager: AnnotationsManager
        handleRemoveRibbon: () => void
    },
) => {
    ReactDOM.render(
        <RibbonSidebarController
            annotationsManager={annotationsManager}
            handleRemoveRibbon={handleRemoveRibbon}
            highlightAll={highlightAnnotations}
            highlightAndScroll={highlightAndScroll}
        />,
        target,
    )
}

export const destroyRibbonAndSidebarUI = (
    target: HTMLElement,
    shadowRoot: ShadowRoot = undefined,
) => {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
