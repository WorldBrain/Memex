import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from '../../common-ui/components'
import AnnotationsManager from '../../sidebar-common/annotations-manager'

const store = configureStore()

interface Props {
    annotationsManager: AnnotationsManager
    handleRemoveRibbon: () => void
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = (props: Props) => {
    const { annotationsManager, handleRemoveRibbon } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarContainer
                    annotationsManager={annotationsManager}
                    handleRemoveRibbon={handleRemoveRibbon}
                />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarController
