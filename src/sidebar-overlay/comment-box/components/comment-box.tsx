import * as React from 'react'
// import { connect } from 'react-redux'

import AnnotationHighlight from './annotation-highlight'
import CommentBoxForm from './comment-box-form'
import { Anchor } from '../../../direct-linking/content_script/interactions'

const styles = require('./comment-box.css')

interface Props {
    anchor?: Anchor
}

interface State {}

class CommentBox extends React.PureComponent<Props, State> {
    state = {}

    // static propTypes = {
    //     env: PropTypes.string.isRequired,
    //     tags: PropTypes.arrayOf(PropTypes.string),
    //     displayHighlightTruncated: PropTypes.bool.isRequired,
    //     saveAnnotation: PropTypes.func.isRequired,
    //     updateAnnotations: PropTypes.func.isRequired,
    //     cancelAnnotation: PropTypes.func.isRequired,
    // }

    // componentDidUpdate(prevProps) {
    //     if (
    //         !prevProps.focusCommentBox &&
    //         this.props.focusCommentBox &&
    //         this.inputRef
    //     ) {
    //         this.inputRef.focus()
    //     }
    // }

    // isHidden = () => this.props.isHidden && !this.props.anchor

    // cancel = () => {
    //     this.props.cancelAnnotation()
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

    // setTagRef = node => (this.tagInputContainer = node)

    // setSaveRef = node => (this.saveButton = node)

    // handleSubmit = e => {
    //     e.preventDefault()
    //     this.save()
    // }

    render() {
        const { anchor } = this.props

        return (
            <div className={styles.commentBoxContainer}>
                {anchor && <AnnotationHighlight anchor={anchor} />}

                {/* <CommentBoxForm
                    placeholder="Add your comment... (save with cmd/ctrl+enter)"
                    handleSubmit={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('submitted')
                    }}
                    handleCancelBtnClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('cancelled')
                    }}
                /> */}
            </div>
        )
    }
}

// const mapStateToProps = state => ({
//     anchor: selectors.anchor(state),
//     commentInput: selectors.commentInput(state),
//     textareaRows: selectors.textareaRows(state),
//     isHidden: selectors.isHidden(state),
//     tagInput: selectors.tagInput(state),
//     displayHighlightTruncated: selectors.displayHighlightTruncated(state),
//     tags: selectors.tags(state),
//     focusCommentBox: selectors.focusCommentBox(state),
// })
// const mapDispatchToProps = dispatch => ({
//     setCommentInput: input => dispatch(actions.setCommentInput(input)),
//     setTextareaRows: rows => dispatch(actions.setTextareaRows(rows)),
//     setHidden: value => dispatch(actions.setHidden(value)),
//     setFocusCommentBox: value => dispatch(actions.setFocusCommentBox(value)),
//     setTagInput: value => dispatch(actions.setTagInput(value)),
//     toggleHighlightTruncation: () =>
//         dispatch(actions.toggleHighlightTruncation()),
//     saveAnnotation: (...args) => dispatch(actions.saveAnnotation(...args)),
//     cancelAnnotation: () => dispatch(actions.cancelAnnotation()),
//     addTag: tag => dispatch(actions.addTag(tag)),
//     deleteTag: tag => dispatch(actions.deleteTag(tag)),
// })

// export default connect(
//     mapStateToProps,
//     mapDispatchToProps,
// )(CommentBox)

export default CommentBox
