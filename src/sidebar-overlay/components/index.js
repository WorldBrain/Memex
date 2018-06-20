import React from 'react'
import ReactDOM from 'react-dom'

import SidebarContainer from './sidebarContainer'
import Ribbon from './Ribbon'

export const setupRibbonUI = target => {
    const sidebarURL = browser.extension.getURL('sidebar.html')
    ReactDOM.render(
        <Ribbon destroy={destroyAll(target)} sidebarURL={sidebarURL} />,
        target,
    )
}

export const destroyAll = target => () => {
    ReactDOM.unmountComponentAtNode(target)
    document.body.removeChild(target)
}

export default SidebarContainer
