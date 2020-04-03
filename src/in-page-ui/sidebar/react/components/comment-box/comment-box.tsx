import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import classNames from 'classnames'
import noop from 'lodash/fp/noop'

import AnnotationHighlight from '../annotation-highlight'
import CommentBoxForm from './comment-box-form'
import { Anchor, HighlightInteractionInterface } from 'src/highlighting/types'

const styles = require('./comment-box.css')

interface StateProps {
    anchor: Anchor
    commentText: string
    tags: string[]
    isCommentBookmarked: boolean
}

interface DispatchProps {
    handleCommentTextChange: (comment: string) => void
    saveComment: (
        anchor: Anchor,
        commentText: string,
        tags: string[],
        bookmarked: boolean,
    ) => void
    cancelComment: () => void
    toggleBookmark: () => void
}

interface OwnProps {
    env?: 'inpage' | 'overview'
    isSocialPost?: boolean
    onSaveCb?: () => void
    highlighter: HighlightInteractionInterface
    closeComments?: () => void
}

type Props = StateProps & DispatchProps & OwnProps

export default class CommentBoxContainer extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        onSaveCb: noop,
    }

    save = async e => {
        e.preventDefault()
        e.stopPropagation()

        const {
            anchor,
            commentText,
            tags,
            saveComment,
            isCommentBookmarked,
            onSaveCb,
        } = this.props

        await onSaveCb()

        saveComment(anchor, commentText.trim(), tags, isCommentBookmarked)
    }

    cancelComment = async e => {
        this.props.cancelComment()
        this.props.highlighter.removeTempHighlights()
    }

    render() {
        const {
            env,
            anchor,
            commentText,
            handleCommentTextChange,
            isCommentBookmarked,
            toggleBookmark,
        } = this.props

        return (
            <div
                className={classNames(styles.commentBoxContainer, {
                    [styles.inPage]: env === 'inpage',
                })}
            >
                {!!anchor && (
                    <AnnotationHighlight
                        anchor={anchor}
                        truncateHighlight={false}
                        setTruncateHighlight={() => {}}
                    />
                )}

                <CommentBoxForm
                    env={env}
                    commentText={commentText}
                    handleCommentTextChange={handleCommentTextChange}
                    saveComment={this.save}
                    cancelComment={this.cancelComment}
                    isCommentBookmarked={isCommentBookmarked}
                    toggleBookmark={toggleBookmark}
                    isAnnotation={true} // TODO: we need to pass the right state here
                    addTag={() => {}}
                    deleteTag={() => {}}
                    initTagSuggestions={[]}
                    tagSuggestions={[]}
                    tags={[]}
                />
            </div>
        )
    }
}
