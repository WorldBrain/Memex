import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from './store'
import RibbonSidebarController from './ribbon-sidebar-controller'
import { ErrorBoundary, RuntimeError } from '../common-ui/components'

const store = configureStore()

/* tslint:disable-next-line variable-name */
const RibbonSidebarContainer = () => (
    <ErrorBoundary component={RuntimeError}>
        <Provider store={store}>
            <RibbonSidebarController />
        </Provider>
    </ErrorBoundary>
)

export default RibbonSidebarContainer
