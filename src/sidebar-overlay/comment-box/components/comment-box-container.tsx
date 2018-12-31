import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import AnnotationHighlight from './annotation-highlight'
import CommentBoxForm from './comment-box-form'
import { Anchor } from '../../../direct-linking/content_script/interactions'
import { RootState } from '../../ribbon-sidebar-controller'
import { MapDispatchToProps, ClickHandler } from '../../types'

const styles = require('./comment-box-container.css')

interface StateProps {
    anchor: Anchor
    commentText: string
    tags: string[]
}

interface DispatchProps {
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLElement>
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

// TODO: Fetch initial tag suggestions when the component is mounted.
class CommentBoxContainer extends React.PureComponent<Props> {
    // static propTypes = {
    //     env: PropTypes.string.isRequired,
    //     updateAnnotations: PropTypes.func.isRequired,
    // }

    // save = () => {
    //     const strippedComment = this.props.commentInput.trim()
    //     if (strippedComment.length || this.props.anchor) {
    //         const body = this.props.anchor ? this.props.anchor.quote : ''
    //         this.props.saveAnnotation(
    //             strippedComment,
    //             body,
    //             this.props.tags,
    //             this.props.env,
    //         )
    //         // Update highlights only if it's in iframe
    //         if (this.props.env === 'iframe') {
    //             this.props.updateAnnotations()
    //         }
    //     }
    // }

    // handleSubmit = e => {
    //     e.preventDefault()
    //     this.save()
    // }

    render() {
        const {
            anchor,
            commentText,
            handleCommentTextChange,
            saveComment,
            cancelComment,
        } = this.props

        return (
            <div className={styles.commentBoxContainer}>
                {anchor !== null && <AnnotationHighlight anchor={anchor} />}

                <CommentBoxForm
                    commentText={commentText}
                    handleCommentTextChange={handleCommentTextChange}
                    saveComment={saveComment}
                    cancelComment={cancelComment}
                />
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    anchor: selectors.anchor(state),
    commentText: selectors.commentText(state),
    tags: selectors.tags(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleCommentTextChange: comment => {
        dispatch(actions.setCommentText(comment))
    },
    saveComment: e => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(actions.saveComment())
    },
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
