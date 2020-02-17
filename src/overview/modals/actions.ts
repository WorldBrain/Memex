import { createAction } from 'redux-act'
import { ModalIds } from 'src/overview/modals/reducer'

export const show = createAction<{
    modalId: ModalIds
    options?: any
}>('modals/show')
export const close = createAction('modals/close')
export const closed = createAction<any>('modals/closed')
