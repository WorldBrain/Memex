import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarContainer from './ribbon-sidebar-container'

export const setupRibbonAndSidebarUI = (target: HTMLElement) => {
    ReactDOM.render(<RibbonSidebarContainer />, target)
}
