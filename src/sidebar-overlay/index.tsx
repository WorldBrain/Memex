import * as React from 'react'
import * as ReactDOM from 'react-dom'

import RibbonSidebarController from './ribbon-sidebar-controller'
import AnnotationsManager from '../annotations/annotations-manager'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import { HighlightInteraction } from '../highlighting/ui/highlight-interactions'
import { SidebarContextInterface } from 'src/sidebar-overlay/types'
import { StyleSheetManager } from 'styled-components'

export const SidebarContext = React.createContext<SidebarContextInterface>(null)
export const sidebarDependencies = {
    highlighter: new HighlightInteraction(),
}
export const setupRibbonAndSidebarUI = (
    target: HTMLElement,
    shadow: HTMLElement,
    {
        annotationsManager,
        handleRemoveRibbon,
        insertOrRemoveTooltip,
        setRibbonSidebarRef,
        forceExpandRibbon = false,
        store,
        ...props
    }: {
        annotationsManager: AnnotationsManager
        handleRemoveRibbon: () => void
        insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
        setRibbonSidebarRef: any
        forceExpandRibbon?: boolean
        store: any
    } & Partial<KeyboardActions>,
) => {
    ReactDOM.render(
        <StyleSheetManager target={shadow}>
            <SidebarContext.Provider value={sidebarDependencies}>
                <RibbonSidebarController
                    setRibbonSidebarRef={setRibbonSidebarRef}
                    annotationsManager={annotationsManager}
                    handleRemoveRibbon={handleRemoveRibbon}
                    insertOrRemoveTooltip={insertOrRemoveTooltip}
                    forceExpand={forceExpandRibbon}
                    store={store}
                    {...props}
                />
            </SidebarContext.Provider>
        </StyleSheetManager>,
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
