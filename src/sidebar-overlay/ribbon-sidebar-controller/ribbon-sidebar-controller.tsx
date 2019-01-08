import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from '../store'
import RibbonSidebarContainer from './ribbon-sidebar-container'
import { ErrorBoundary, RuntimeError } from '../../common-ui/components'

const store = configureStore()

interface Props {
    handleRemoveRibbon: () => void
}

/* tslint:disable-next-line variable-name */
const RibbonSidebarController = (props: Props) => {
    const { handleRemoveRibbon } = props

    return (
        <ErrorBoundary component={RuntimeError}>
            <Provider store={store}>
                <RibbonSidebarContainer
                    handleRemoveRibbon={handleRemoveRibbon}
                />
            </Provider>
        </ErrorBoundary>
    )
}

export default RibbonSidebarController
