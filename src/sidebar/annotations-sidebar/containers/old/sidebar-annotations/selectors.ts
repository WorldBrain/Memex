import { StateSelector } from 'src/sidebar/annotations-sidebar/types'

interface PickerOpen {
    areTagsOpen?: boolean
    areListsOpen?: boolean
    isCommentBox?: boolean
    pageUrl?: string
    annotationUrl?: string
}

export const areAnyPickersOpen: StateSelector<PickerOpen> = ({
    commentBox,
    resultsByUrl,
}) => {
    if (commentBox.form.showTagsPicker) {
        return { areTagsOpen: true, isCommentBox: true }
    }

    for (const url in resultsByUrl) {
        if (resultsByUrl[url].shouldDisplayListPopup) {
            return { areListsOpen: true, pageUrl: url }
        } else if (resultsByUrl[url].shouldDisplayTagPopup) {
            return { areTagsOpen: true, pageUrl: url }
        }
    }

    return { areListsOpen: false, areTagsOpen: false }
}
