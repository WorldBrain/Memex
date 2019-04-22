import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import AnnotationsManager from 'src/sidebar-overlay/annotations-manager'
import { Annotation, KeyboardActions } from 'src/sidebar-overlay/sidebar/types'

const store = configureStore()

interface Props extends Partial<KeyboardActions> {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    highlightAll: (
        highlights: Annotation[],
        openSidebar: (args: { activeUrl?: string }) => void,
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
    ) => void
    highlightAndScroll: (annotation: Annotation) => number
    removeHighlights: () => void
    makeHighlightMedium: (annotation: Annotation) => void
    removeMediumHighlights: () => void
    sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
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
