import * as React from 'react'

import CommentTags from './comment-tags'
import AllModesFooter from './all-modes-footer'
import { ShareAnnotationProps } from './default-footer'

interface Props extends ShareAnnotationProps {
    env: 'inpage' | 'overview'
    mode: 'default' | 'delete'
    body?: string
    comment?: string
    tags: string[]
    isEdited: boolean
    timestamp: string
    hasBookmark: boolean
    handleGoToAnnotation: (e: React.MouseEvent<HTMLElement>) => void
    handleDeleteAnnotation: () => void
    handleCancelOperation: () => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    shareIconClickHandler: () => void
    handleCopyPasterClick?: () => void
    handleTagClick: (tag: string) => void
    handleBookmarkToggle: () => void
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
                handleTagClick={props.handleTagClick}
            />
        )}

        {/* Footer. */}
        <AllModesFooter
            {...props}
            mode={props.mode}
            isEdited={props.isEdited}
            timestamp={props.timestamp}
            hasBookmark={props.hasBookmark}
            displayGoToAnnotation={props.body && props.env === 'overview'}
            handleGoToAnnotation={props.handleGoToAnnotation}
            handleDeleteAnnotation={props.handleDeleteAnnotation}
            handleCancelDeletion={props.handleCancelOperation}
            editIconClickHandler={props.editIconClickHandler}
            trashIconClickHandler={props.trashIconClickHandler}
            handleBookmarkToggle={props.handleBookmarkToggle}
        />
    </React.Fragment>
)

export default DefaultDeleteModeContent
