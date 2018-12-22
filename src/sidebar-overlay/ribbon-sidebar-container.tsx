import * as React from 'react'
import { Provider } from 'react-redux'

import configureStore from './store'
import RibbonContainer from './ribbon'

const store = configureStore()

/* tslint:disable-next-line variable-name */
const RibbonSidebarContainer = () => (
    <Provider store={store}>
        <RibbonContainer handleRemoveRibbon={() => null} />
    </Provider>
)

export default RibbonSidebarContainer
