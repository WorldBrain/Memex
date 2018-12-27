import * as React from 'react'
// import PropTypes from 'prop-types'
// import cx from 'classnames'
// import { connect } from 'react-redux'

// import * as constants from '../constants'
import AnnotationHighlight from './annotation-highlight'
import CommentBoxForm from './comment-box-form'
import { Anchor } from '../../../direct-linking/content_script/interactions'

const styles = require('./comment-box.css')

interface Props {
    anchor?: Anchor
}

interface State {
    truncateHighlight: boolean
}

class CommentBox extends React.PureComponent<Props, State> {
    state = {
        truncateHighlight: true,
    }

    private _toggleHighlightTruncation = () => {
        this.setState(prevState => ({
            truncateHighlight: !prevState.truncateHighlight,
        }))
    }

    // static propTypes = {
    //     anchor: PropTypes.shape({
    //         quote: PropTypes.string.isRequired,
    //         descriptor: PropTypes.object.isRequired,
    //     }),
    //     env: PropTypes.string.isRequired,
    //     commentInput: PropTypes.string.isRequired,
    //     textareaRows: PropTypes.number.isRequired,
    //     isHidden: PropTypes.bool.isRequired,
    //     tagInput: PropTypes.bool.isRequired,
    //     focusCommentBox: PropTypes.bool.isRequired,
    //     tags: PropTypes.arrayOf(PropTypes.string),
    //     displayHighlightTruncated: PropTypes.bool.isRequired,
    //     saveAnnotation: PropTypes.func.isRequired,
    //     updateAnnotations: PropTypes.func.isRequired,
    //     cancelAnnotation: PropTypes.func.isRequired,
    //     setCommentInput: PropTypes.func.isRequired,
    //     setTextareaRows: PropTypes.func.isRequired,
    //     setHidden: PropTypes.func.isRequired,
    //     // setFocusCommentBox: PropTypes.func.isRequired,
    //     setTagInput: PropTypes.func.isRequired,
    //     toggleHighlightTruncation: PropTypes.func.isRequired,
    // }

    // componentDidMount() {
    //     // Auto resize textarea
    //     if (this.inputRef) {
    //         this.inputRef.addEventListener('scroll', e => {
    //             let i = 0
    //             // i prevents infinity loop when resizing
    //             while (e.target.scrollTop && i++ < 30) {
    //                 // For dynamically getting the height even if resized
    //                 let height = window.getComputedStyle(e.target).height
    //                 height = parseInt(height, 10)
    //                 e.target.style.height = height + 20 + 'px'
    //             }
    //         })
    //     }

    //     if (this.inputRef && this.props.env === 'overview') {
    //         this.inputRef.focus()
    //     }

    //     this.attachEventListener()
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

    // maybeCloseTagsDropdown = e => {
    //     if (!this.props.tagInput) {
    //         return
    //     } else if (
    //         (this.tagInputContainer &&
    //             this.tagInputContainer.contains(e.target)) ||
    //         e.target === this.saveButton
    //     ) {
    //         return
    //     }

    //     this.props.setTagInput(false)
    // }

    // attachEventListener = () => {
    //     // Attaches on click listener to close the tags input
    //     // when clicked outside
    //     // TODO: Use refs instead of manually calling it
    //     const sidebar = document.querySelector('#memex-sidebar-panel')
    //     sidebar.addEventListener('click', this.maybeCloseTagsDropdown, false)
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

        const { truncateHighlight } = this.state

        return (
            <div className={styles.commentBoxContainer}>
                {anchor && (
                    <AnnotationHighlight
                        anchor={anchor}
                        truncateHighlight={truncateHighlight}
                        toggleHighlightTruncation={
                            this._toggleHighlightTruncation
                        }
                    />
                )}

                <CommentBoxForm
                    handleSubmit={() => null}
                    handleCancelBtnClick={() => null}
                />
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
