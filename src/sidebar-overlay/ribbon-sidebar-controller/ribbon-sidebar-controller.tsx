import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from '../../common-ui/components'
import AnnotationsManager from '../../sidebar-common/annotations-manager'
import { Annotation } from '../../sidebar-common/types'

const store = configureStore()

interface Props {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
    highlightAll: (
        highlights: Annotation[],
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
    ) => void
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = (props: Props) => {
    const { annotationsManager, handleRemoveRibbon, highlightAll } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarContainer
                    annotationsManager={annotationsManager}
                    handleRemoveRibbon={handleRemoveRibbon}
                    highlightAll={highlightAll}
                />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarController
