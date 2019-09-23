import { createAction, createReducer } from 'redux-act'
import { PageList } from 'src/custom-lists/background/types'

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

const _openUserSubscriptionPortal = createAction(
    'auth/openUserSubscriptionPortal',
) as any
export const openUserSubscriptionPortal = (
    collection: PageList,
) => async dispatch => {
    dispatch(_openUserSubscriptionPortal())
}
