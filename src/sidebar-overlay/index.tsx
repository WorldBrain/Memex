import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { HighlightInteractions } from '../highlighting/ui/highlight-interactions'
import { SidebarContextInterface } from 'src/sidebar-overlay/types'

export const SidebarContext = React.createContext<SidebarContextInterface>(null)
export const sidebarDependencies = {
    highlighter: new HighlightInteractions(),
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
