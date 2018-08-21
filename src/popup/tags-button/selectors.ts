import { createSelector } from 'reselect'

import { RootState } from '../types'

const tagsBtn = (state: RootState) => state.tagsBtn

export const showTagsPicker = createSelector(
    tagsBtn,
    state => state.showTagsPicker,
)

export const tags = createSelector(tagsBtn, state => state.tags)
export const initTagSuggestions = createSelector(
    tagsBtn,
    state => state.initTagSuggestions,
)
