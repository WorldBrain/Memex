import * as React from 'react'

import CommentTags from './comment-tags'
import AllModesFooter from './all-modes-footer'

interface Props {
    env: 'inpage' | 'overview'
    mode: 'default' | 'delete'
    body?: string
    comment?: string
    tags: string[]
    handleGoToAnnotation: (e: React.MouseEvent<HTMLElement>) => void
    handleDeleteAnnotation: () => void
    handleCancelOperation: () => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    shareIconClickHandler: () => void
    replyIconClickHandler: () => void
    getTruncatedTextObject: (
        text: string,
    ) => {
        isTextTooLong: boolean
        text: string
    }
}

/* tslint:disable-next-line variable-name */
const DefaultDeleteModeContent = (props: Props) => (
    <React.Fragment>
        {/* Comment and tags to be displayed. */}
        {(props.comment || (props.tags && props.tags.length !== 0)) && (
            <CommentTags
                comment={props.comment}
                tags={props.tags}
                isJustComment={!props.body}
                getTruncatedTextObject={props.getTruncatedTextObject}
            />
        )}

        {/* Footer. */}
        <AllModesFooter
            mode={props.mode}
            displayGoToAnnotation={props.body && props.env === 'overview'}
            handleGoToAnnotation={props.handleGoToAnnotation}
            handleDeleteAnnotation={props.handleDeleteAnnotation}
            handleCancelDeletion={props.handleCancelOperation}
            editIconClickHandler={props.editIconClickHandler}
            trashIconClickHandler={props.trashIconClickHandler}
            shareIconClickHandler={props.shareIconClickHandler}
            replyIconClickHandler={props.replyIconClickHandler}
        />
    </React.Fragment>
)

export default DefaultDeleteModeContent
