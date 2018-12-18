import 'babel-polyfill'
import * as React from 'react'
import { Provider } from 'react-redux'

import SidebarContainer from './sidebar-container'
import { store } from '../../redux'
import { ErrorBoundary, RuntimeError } from '../../../common-ui/components'

interface Props {
    showSidebar?: boolean
    setShowSidebar?: any
    toggleMouseOnSidebar?: any
    env?: string
}

/* tslint:disable-next-line variable-name */
const Sidebar = (props: Props) => (
    <ErrorBoundary component={RuntimeError}>
        <Provider store={store}>
            <SidebarContainer {...props} />
        </Provider>
    </ErrorBoundary>
)

export default Sidebar
