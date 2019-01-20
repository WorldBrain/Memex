import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import AnnotationsManager from 'src/sidebar-common/annotations-manager'
import { Annotation } from 'src/sidebar-common/sidebar/types'

const store = configureStore()

interface Props {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
    highlightAll: (
        highlights: Annotation[],
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
    ) => void
    highlightAndScroll: (annotation: Annotation) => number
    removeHighlights: () => void
    makeHighlightMedium: (annotation: Annotation) => void
    removeMediumHighlights: () => void
    setRibbonSidebarRef: any
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
