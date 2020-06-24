import * as React from 'react'
import CommentTags from 'src/annotations/components/old/edit/comment-tags'
import AllModesFooter from './old/edit/all-modes-footer'

interface Props {
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
    handleTagClick: (tag: string) => void
    handleBookmarkToggle: () => void
    getTruncatedTextObject: (
        text: string,
    ) => {
        isTextTooLong: boolean
        text: string
    }
}

/* tslint:disable-next-line variable-name */
const AnnotationView = (props: Props) => (
    <React.Fragment>
        {/* Comment and tags to be displayed. */}
        {(props.comment || (props.tags && props.tags.length !== 0)) && (
            <CommentTags
                comment={props.comment}
                tags={props.tags}
                isJustComment={!props.body}
                handleTagClick={props.handleTagClick}
                getTruncatedTextObject={props.getTruncatedTextObject}
            />
        )}

        {/* Footer. */}
        <AllModesFooter
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

export default AnnotationView
