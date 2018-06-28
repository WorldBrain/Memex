import React from 'react'
import ReactDOM from 'react-dom'

import SidebarContainer from './sidebarContainer'
import Ribbon from './Ribbon'

import { highlightAnnotations } from '../interactions'
import { removeHighlights } from 'src/direct-linking/content_script/interactions'

export const setupRibbonUI = target => {
    const sidebarURL = browser.extension.getURL('sidebar.html')
    ReactDOM.render(
        <Ribbon
            destroy={destroyAll(target)}
            sidebarURL={sidebarURL}
            highlightAll={highlightAnnotations}
            removeHighlights={removeHighlights}
        />,
        target,
    )
}

export const destroyAll = target => () => {
    ReactDOM.unmountComponentAtNode(target)
    document.body.removeChild(target)
}

export default SidebarContainer
