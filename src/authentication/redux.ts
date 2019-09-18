import { createAction, createReducer } from 'redux-act'
const defaultState = {
    currentUser: null, // auth service or user?
}

export const setCurrentUser = createAction('auth/setCurrentUser') as any
export const authReducer = createReducer(
    {
        [setCurrentUser]: (state, currentUser) => ({
            ...state,
            auth: { currentUser },
        }),
    },
    defaultState,
)
