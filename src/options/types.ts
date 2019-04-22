import { ThunkAction } from 'redux-thunk'

import { State as DeleteConfModalState } from '../overview/delete-confirm-modal/reducer'
import { State as SearchBarState } from '../overview/search-bar/reducer'
import { State as ResultsState } from '../overview/results/reducer'
import { State as TooltipsState } from '../overview/tooltips/reducer'
import { State as OnboardingState } from '../overview/onboarding/reducer'
import { RootState as SearchFiltersState } from 'src/search-filters/types'

export interface RootState {
    deleteConfModal: DeleteConfModalState
    searchBar: SearchBarState
    results: ResultsState
    tooltips?: TooltipsState
    onboarding?: OnboardingState
    searchFilters: SearchFiltersState
}

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>
