import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import classNames from 'classnames'
import noop from 'lodash/fp/noop'

import * as actions from '../actions'
import * as selectors from '../selectors'
import State from '../types'
import { AnnotationHighlight } from '../../components'
import CommentBoxForm from './comment-box-form'
import { MapDispatchToProps } from '../../types'
import { Anchor, HighlightInteractionInterface } from 'src/highlighting/types'
import { withSidebarContext } from 'src/sidebar-overlay/ribbon-sidebar-controller/sidebar-context'

const styles = require('./comment-box-container.css')

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

class CommentBoxContainer extends React.PureComponent<Props> {
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

    cancelComment = () => {
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
                {!!anchor && <AnnotationHighlight anchor={anchor} />}

                <CommentBoxForm
                    env={env}
                    commentText={commentText}
                    handleCommentTextChange={handleCommentTextChange}
                    saveComment={this.save}
                    cancelComment={this.cancelComment}
                    isCommentBookmarked={isCommentBookmarked}
                    toggleBookmark={toggleBookmark}
                    isAnnotation={true} // TODO: we need to pass the right state here
                />
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    State
> = state => ({
    anchor: selectors.anchor(state),
    commentText: selectors.commentText(state),
    tags: selectors.tags(state),
    isCommentBookmarked: selectors.isBookmarked(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
    props,
) => ({
    handleCommentTextChange: comment =>
        dispatch(actions.setCommentText(comment)),
    saveComment: async (anchor, commentText, tags, bookmarked) => {
        if (props.closeComments) {
            props.closeComments()
        }

        dispatch(
            actions.saveComment(
                anchor,
                commentText,
                tags,
                bookmarked,
                props.isSocialPost,
            ),
        )
    },
    cancelComment: () => {
        dispatch(actions.cancelComment())
    },
    toggleBookmark: () => dispatch(actions.toggleBookmark()),
})

export default withSidebarContext(
    // @ts-ignore
    connect(mapStateToProps, mapDispatchToProps)(CommentBoxContainer),
)
