import { PageList } from 'src/custom-lists/background/types'

export interface State {
    activeListIndex: number
    listFilterIndex: string
    lists: PageList[]
    deleteConfirmProps: {
        isShown: boolean
        id: number
        // Used to keep track of any particular result (use index)
        deleting: number
    }
    urlDragged: string
    showCreateListForm: boolean
    showCommonNameWarning: boolean
    showCrowdFundingModal: boolean
    shareModalProps: {
        isShown: boolean
        index: number
    }
}
