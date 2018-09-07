import { ThunkAction } from 'redux-thunk'

import { State as DeleteConfModalState } from '../overview/delete-confirm-modal/reducer'
import { State as SearchBarState } from '../overview/search-bar/reducer'
import { State as ResultsState } from '../overview/results/reducer'
import { State as TooltipsState } from '../overview/tooltips/reducer'

export interface RootState {
    deleteConfModal: DeleteConfModalState
    searchBar: SearchBarState
    results: ResultsState
    tooltips: TooltipsState
}

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>
