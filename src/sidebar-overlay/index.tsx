import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarController from './ribbon-sidebar-controller'
import AnnotationsManager from '../annotations/annotations-manager'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import {
    renderHighlights,
    highlightAndScroll,
    removeHighlights,
    makeHighlightMedium,
    removeMediumHighlights,
    sortAnnotationsByPosition,
    removeTempHighlights,
} from '../highlighting/ui/highlight-interactions'

export const setupRibbonAndSidebarUI = (
    target: HTMLElement,
    {
        annotationsManager,
        handleRemoveRibbon,
        insertOrRemoveTooltip,
        setRibbonSidebarRef,
        forceExpandRibbon = false,
        ...props
    }: {
        annotationsManager: AnnotationsManager
        handleRemoveRibbon: () => void
        insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
        setRibbonSidebarRef: any
        forceExpandRibbon?: boolean
    } & Partial<KeyboardActions>,
) => {
    ReactDOM.render(
        <RibbonSidebarController
            setRibbonSidebarRef={setRibbonSidebarRef}
            annotationsManager={annotationsManager}
            handleRemoveRibbon={handleRemoveRibbon}
            insertOrRemoveTooltip={insertOrRemoveTooltip}
            highlightAll={renderHighlights}
            highlightAndScroll={highlightAndScroll}
            removeHighlights={removeHighlights}
            makeHighlightMedium={makeHighlightMedium}
            removeMediumHighlights={removeMediumHighlights}
            removeTempHighlights={removeTempHighlights}
            sortAnnotationsByPosition={sortAnnotationsByPosition}
            forceExpand={forceExpandRibbon}
            {...props}
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
