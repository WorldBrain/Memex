import { createSelector } from 'reselect'

import * as RootSelectors from '../selectors'

export const ribbon = RootSelectors.ribbon

export const isPageFullScreen = createSelector(
    ribbon,
    state => state.isPageFullScreen,
)
