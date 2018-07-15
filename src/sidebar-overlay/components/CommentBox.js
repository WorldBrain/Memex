import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import cx from 'classnames'

import { selectors, actions } from '../redux'
import { IndexDropdown } from 'src/common-ui/containers'
import TagHolder from './TagHolder'
import * as constants from '../constants'
import styles from './CommentBox.css'

class CommentBox extends React.Component {
    static propTypes = {
        createAnnotation: PropTypes.func.isRequired,
        setAnchor: PropTypes.func.isRequired,
        anchor: PropTypes.shape({
            quote: PropTypes.string.isRequired,
            descriptor: PropTypes.object.isRequired,
        }),
        env: PropTypes.string.isRequired,
    }

    state = {
        commentInput: '',
        textareaRows: constants.DEFAULT_ROWS,
        minimized: true,
        isHidden: false,
        tagInput: false,
        tags: [],
    }

    componentDidMount() {
        // Auto resize textarea
        this.inputRef.addEventListener('scroll', e => {
            let i = 0
            // i prevents infinity loop when resizing
            while (e.target.scrollTop && i++ < 30) {
                // For dynamically getting the height even if resized
                let height = window.getComputedStyle(e.target).height
                height = parseInt(height, 10)
                e.target.style.height = height + 20 + 'px'
            }
        })

        if (this.props.anchor)
            this.setState({
                isHidden: false,
            })
    }

    isHidden = () => this.state.isHidden && !this.props.anchor

    handleChange = e => {
        let { minimized, textareaRows } = this.state
        const comment = e.target.value

        if (comment.length === 0) {
            textareaRows = constants.DEFAULT_ROWS
            this.inputRef.style.height = ''
        } else if (minimized) {
            minimized = false
            textareaRows = constants.MAXED_ROWS
        }

        this.setState({
            commentInput: comment,
            textareaRows,
        })
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () => {
        this.inputRef.rows = this.state.textareaRows
        this.inputRef.focus()
        this.props.setAnchor(null)
        this.setState({
            commentInput: '',
            textareaRows: constants.DEFAULT_ROWS,
            isHidden: true,
            tagInput: false,
            tags: [],
        })
    }

    save = () => {
        const { commentInput, tags } = this.state
        const { anchor } = this.props
        const strippedComment = commentInput.trim()
        if (strippedComment.length || anchor) {
            const body = anchor ? anchor.quote : ''
            this.props.createAnnotation(strippedComment, body, tags)
            this.setState({
                commentInput: '',
                textareaRows: constants.DEFAULT_ROWS,
                isHidden: true,
                tags: [],
            })
        }
    }

    toggleHidden = () => {
        const isHidden = !this.state.isHidden
        this.setState({
            isHidden,
        })
    }

    addTag = newTag => {
        const tags = [newTag, ...this.state.tags]
        this.setState({
            tags,
        })
    }

    delTag = tag => {
        const oldTags = [...this.state.tags]
        const tagIndex = oldTags.indexOf(tag)

        if (tagIndex === -1) return null

        const tags = [
            ...oldTags.slice(0, tagIndex),
            ...oldTags.slice(tagIndex + 1),
        ]

        this.setState({
            tags,
        })
    }

    _setTagInput = value => () => this.setState({ tagInput: value })

    renderAddNoteButton() {
        if (!this.isHidden()) return null
        return (
            <button className={styles.addNote} onClick={this.toggleHidden}>
                Add note
            </button>
        )
    }

    renderTagInput() {
        const tagObjs = this.state.tags.map(tag => ({ name: tag }))

        if (this.state.tagInput)
            return (
                <IndexDropdown
                    isForAnnotation
                    allowAdd
                    initFilters={this.state.tags}
                    onFilterAdd={this.addTag}
                    onFilterDel={this.delTag}
                    source="tag"
                />
            )
        else
            return (
                <TagHolder
                    tags={tagObjs}
                    clickHandler={this._setTagInput(true)}
                    deleteTag={({ name }) => this.delTag(name)}
                />
            )
    }

    renderCommentBox() {
        if (this.isHidden()) return null
        return (
            <div
                className={cx(styles.commentBox, {
                    [styles.iframe]: this.props.env === 'iframe',
                })}
            >
                <textarea
                    rows={this.state.textareaRows}
                    className={styles.textarea}
                    value={this.state.commentInput}
                    placeholder={'Add your comment...'}
                    onChange={this.handleChange}
                    ref={this.setInputRef}
                    onClick={this._setTagInput(false)}
                />
                <br />
                {this.renderTagInput()}
                <div className={styles.buttonHolder}>
                    <button className={styles.save} onClick={this.save}>
                        Save
                    </button>
                    <a className={styles.cancel} onClick={this.cancel}>
                        Cancel
                    </a>
                </div>
            </div>
        )
    }

    renderHighlightedText() {
        if (!this.props.anchor) return null
        return (
            <div className={styles.highlighted}>
                <div className={styles.newAnnotation}>New Annotation</div>
                <div className={styles.highlightedText}>
                    "{this.props.anchor.quote}"
                </div>
            </div>
        )
    }

    render() {
        if (this.inputRef) this.inputRef.focus()
        return (
            <div className={this.isHidden() ? styles.commentBoxContainer : ''}>
                {this.renderHighlightedText()}
                {this.renderCommentBox()}
                {this.renderAddNoteButton()}
            </div>
        )
    }
}
const mapStateToProps = state => ({
    anchor: selectors.anchor(state),
})
const mapDispatchToProps = dispatch => ({
    createAnnotation: (comment, body, tags) =>
        dispatch(actions.createAnnotation(comment, body, tags)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBox)
