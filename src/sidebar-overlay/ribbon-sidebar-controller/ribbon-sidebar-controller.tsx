import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import { Annotation } from 'src/annotations/types'
import { withSidebarContext } from 'src/sidebar-overlay/ribbon-sidebar-controller/sidebar-context'

const store = configureStore()

interface Props extends Partial<KeyboardActions> {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    setRibbonSidebarRef: any
    forceExpand?: boolean
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = (props: Props) => {
    const { setRibbonSidebarRef, ...rest } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarContainer {...rest} ref={setRibbonSidebarRef} />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarController
