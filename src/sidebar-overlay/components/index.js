import React from 'react'
import ReactDOM from 'react-dom'

import SidebarContainer from './sidebarContainer'
import Ribbon from './Ribbon'
import { remoteFunction } from '../../util/webextensionRPC'
import * as interactions from '../content_script/interactions'

const processEventRPC = remoteFunction('processEvent')

export const setupRibbonUI = (
    target,
    {
        onInit,
        onClose,
        getInitialState,
        handleRibbonToggle,
        handleTooltipToggle,
    },
) => {
    const sidebarURL = browser.extension.getURL('sidebar.html')

    ReactDOM.render(
        <Ribbon
            onInit={onInit}
            destroy={() => {
                onClose()
            }}
            getInitialState={getInitialState}
            handleRibbonToggle={handleRibbonToggle}
            handleTooltipToggle={handleTooltipToggle}
            sidebarURL={sidebarURL}
            highlightAll={interactions.highlightAnnotations}
            removeHighlights={interactions.removeHighlights}
            removeAnnotationHighlights={interactions.removeAnnotationHighlights}
            highlightAndScroll={interactions.highlightAndScroll}
            makeHighlightMedium={interactions.makeHighlightMedium}
            removeMediumHighlights={interactions.removeMediumHighlights}
            sortAnnotationByPosition={interactions.sortAnnotationByPosition}
        />,
        target,
    )
}

export const destroyAll = (target, shadowRoot = null) => () => {
    processEventRPC({ type: 'disableSidebarPage' })

    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot !== null) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}

export default SidebarContainer
