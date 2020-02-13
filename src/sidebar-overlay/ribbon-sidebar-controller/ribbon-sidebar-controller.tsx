import * as React from 'react'
import { Provider } from 'react-redux'

import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'

interface Props extends Partial<KeyboardActions> {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    setRibbonSidebarRef: any
    forceExpand?: boolean
    store: any
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = (props: Props) => {
    const { setRibbonSidebarRef, store, ...rest } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarContainer
                    {...rest}
                    innerRef={setRibbonSidebarRef}
                />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarController
