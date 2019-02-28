import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import State from '../types'
import { AnnotationHighlight } from '../../components'
import CommentBoxForm from './comment-box-form'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import { MapDispatchToProps, ClickHandler } from '../../types'

const styles = require('./comment-box-container.css')

interface StateProps {
    anchor: Anchor
    commentText: string
    tags: string[]
}

interface DispatchProps {
    handleCommentTextChange: (comment: string) => void
    saveComment: (anchor: Anchor, commentText: string, tags: string[]) => void
    cancelComment: ClickHandler<HTMLElement>
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

// TODO: Fetch initial tag suggestions when the component is mounted.
class CommentBoxContainer extends React.PureComponent<Props> {
    save = (e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const { anchor, commentText, tags, saveComment } = this.props
        saveComment(anchor, commentText.trim(), tags)
    }

    render() {
        const {
            anchor,
            commentText,
            handleCommentTextChange,
            cancelComment,
        } = this.props

        return (
            <div className={styles.commentBoxContainer}>
                {!!anchor && <AnnotationHighlight anchor={anchor} />}

                <CommentBoxForm
                    commentText={commentText}
                    handleCommentTextChange={handleCommentTextChange}
                    saveComment={this.save}
                    cancelComment={cancelComment}
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
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleCommentTextChange: comment =>
        dispatch(actions.setCommentText(comment)),
    saveComment: (anchor, commentText, tags) =>
        dispatch(actions.saveComment(anchor, commentText, tags)),
    cancelComment: e => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(actions.cancelComment())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBoxContainer)
