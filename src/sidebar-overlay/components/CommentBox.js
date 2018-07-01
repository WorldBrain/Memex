import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import { IndexDropdown } from 'src/common-ui/containers'
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
    }

    state = {
        commentInput: '',
        textareaRows: constants.DEFAULT_ROWS,
        minimized: true,
        isHidden: false,
        tags: [],
    }

    componentDidMount() {
        // Increase rows instead of having a scrollbar
        this.inputRef.focus()
        this.inputRef.addEventListener('scroll', e => {
            while (e.target.scrollTop) e.target.rows += 1
        })
    }

    handleChange = e => {
        let { minimized, textareaRows } = this.state
        const comment = e.target.value

        if (comment.length === 0) {
            textareaRows = constants.DEFAULT_ROWS
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
        })
    }

    save = () => {
        const { commentInput } = this.state
        const { anchor } = this.props
        if (commentInput.length || anchor) {
            const body = anchor ? anchor.quote : ''
            this.props.createAnnotation(commentInput, body)
            this.setState({
                commentInput: '',
                textareaRows: constants.DEFAULT_ROWS,
                isHidden: true,
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

    renderCancelButton() {
        return (
            <a className={styles.cancel} onClick={this.cancel}>
                Cancel
            </a>
        )
    }

    renderAddNoteButton() {
        if (!this.state.isHidden) return null
        return (
            <button className={styles.addNote} onClick={this.toggleHidden}>
                Add note
            </button>
        )
    }

    renderCommentBox() {
        if (this.state.isHidden) return null
        return (
            <div className={styles.commentBox}>
                <textarea
                    rows={this.state.textareaRows}
                    cols="38"
                    className={styles.textarea}
                    value={this.state.commentInput}
                    placeholder={'Add new note'}
                    onChange={this.handleChange}
                    ref={this.setInputRef}
                />
                <br />
                <IndexDropdown
                    isForAnnotation
                    allowAdd
                    initFilters={this.state.tags}
                    onFilterAdd={this.addTag}
                    onFilterDel={this.delTag}
                    source="tag"
                />
                <div className={styles.buttonHolder}>
                    {this.renderCancelButton()}
                    <button className={styles.greenButton} onClick={this.save}>
                        Save
                    </button>
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
                    {this.props.anchor.quote}
                </div>
            </div>
        )
    }

    render() {
        return (
            <div
                className={
                    this.state.isHidden ? styles.commentBoxContainer : ''
                }
            >
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
    createAnnotation: (comment, body) =>
        dispatch(actions.createAnnotation(comment, body)),
    setAnchor: anchor => dispatch(actions.setAnchor(anchor)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(CommentBox)
