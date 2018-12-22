import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarContainer from './ribbon-sidebar-container'

export const setupRibbonAndSidebarUI = (
    target: HTMLElement,
    { handleRemoveRibbon }: { handleRemoveRibbon: () => void },
) => {
    ReactDOM.render(
        <RibbonSidebarContainer handleRemoveRibbon={handleRemoveRibbon} />,
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
