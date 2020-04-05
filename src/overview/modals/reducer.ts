import { createReducer } from 'redux-act'

import * as acts from './actions'

export type ModalIds = 'Subscription' | null

export interface State {
    modalId?: ModalIds
    modalOptions?: any
}

const defState: State = {
    modalId: null,
    modalOptions: {},
}

export const reducer = createReducer<State>({}, defState)

reducer.on(acts.show, (state, { modalId, options }) => {
    return {
        ...state,
        modalId,
        modalOptions: options,
    }
})

reducer.on(acts.close, state => {
    return {
        ...state,
        modalId: null,
        modalOptions: {},
    }
})
