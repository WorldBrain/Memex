import React from 'react'
import ReactDOM from 'react-dom'

import SidebarContainer from './sidebarContainer'
import Ribbon from './Ribbon'
import { remoteFunction } from '../../util/webextensionRPC'
import * as interactions from '../content_script/interactions'

const processEventRPC = remoteFunction('processEvent')

export const setupRibbonUI = target => {
    const sidebarURL = browser.extension.getURL('sidebar.html')

    ReactDOM.render(
        <Ribbon
            destroy={destroyAll(target)}
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

export const destroyAll = target => () => {
    processEventRPC({ type: 'disableSidebarPage' })

    ReactDOM.unmountComponentAtNode(target)
    document.body.removeChild(target)
}

export default SidebarContainer
