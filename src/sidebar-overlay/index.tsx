import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarController from './ribbon-sidebar-controller'

export const setupRibbonAndSidebarUI = (
    target: HTMLElement,
    { handleRemoveRibbon }: { handleRemoveRibbon: () => void },
) => {
    ReactDOM.render(
        <RibbonSidebarController handleRemoveRibbon={handleRemoveRibbon} />,
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
