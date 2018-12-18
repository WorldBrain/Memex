import React from 'react'
import ReactDOM from 'react-dom'

import Ribbon from './ribbon'
import { remoteFunction } from '../../util/webextensionRPC'
import * as interactions from '../content_script/interactions'
import { EVENT_NAMES } from '../../analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')

export const setupRibbonUI = (
    target,
    {
        onInit,
        onClose,
        getInitialState,
        handleRibbonToggle,
        handleTooltipToggle,
        setRibbonRef,
    },
) => {
    const sidebarURL = browser.extension.getURL('sidebar.html')

    ReactDOM.render(
        <Ribbon
            onInit={onInit}
            destroy={e => {
                e.stopPropagation()
                onClose()
            }}
            ref={setRibbonRef}
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
    processEventRPC({
        type: EVENT_NAMES.DISABLE_SIDEBAR_PAGE,
    })

    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot !== null) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
