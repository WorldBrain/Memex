import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import classNames from 'classnames'

import * as actions from '../actions'
import * as selectors from '../selectors'
import State from '../types'
import { AnnotationHighlight } from '../../components'
import CommentBoxForm from './comment-box-form'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import { MapDispatchToProps } from '../../types'

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
}

type Props = StateProps & DispatchProps & OwnProps

class CommentBoxContainer extends React.PureComponent<Props> {
    save = e => {
        e.preventDefault()
        e.stopPropagation()

        const {
            anchor,
            commentText,
            tags,
            saveComment,
            isCommentBookmarked,
        } = this.props
        saveComment(anchor, commentText.trim(), tags, isCommentBookmarked)
    }

    render() {
        const {
            env,
            anchor,
            commentText,
            handleCommentTextChange,
            cancelComment,
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
                    cancelComment={cancelComment}
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

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleCommentTextChange: comment =>
        dispatch(actions.setCommentText(comment)),
    saveComment: (anchor, commentText, tags, bookmarked) =>
        dispatch(actions.saveComment(anchor, commentText, tags, bookmarked)),
    cancelComment: () => dispatch(actions.cancelComment()),
    toggleBookmark: () => dispatch(actions.toggleBookmark()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBoxContainer)
