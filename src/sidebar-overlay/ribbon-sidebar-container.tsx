import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from './store'
import RibbonSidebarController from './ribbon-sidebar-controller'
import { ErrorBoundary, RuntimeError } from '../common-ui/components'

const store = configureStore()

interface Props {
    handleRemoveRibbon: () => void
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarContainer = (props: Props) => {
    const { handleRemoveRibbon } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarController
                    handleRemoveRibbon={handleRemoveRibbon}
                />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarContainer
