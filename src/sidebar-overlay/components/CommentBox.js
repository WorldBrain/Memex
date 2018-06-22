import React from 'react'
import PropTypes from 'prop-types'

import * as constants from '../constants'
import styles from './CommentBox.css'

class CommentBox extends React.Component {
    static propTypes = {
        saveComment: PropTypes.func.isRequired,
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
        this.setState({
            commentInput: '',
            textareaRows: constants.DEFAULT_ROWS,
        })
    }

    save = () => {
        const { commentInput } = this.state
        if (commentInput.length) {
            this.props.saveComment(commentInput)
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
                <input
                    type="text"
                    className={styles.tagsInput}
                    placeholder="Add tags"
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

    render() {
        return (
            <div
                className={
                    this.state.isHidden ? styles.commentBoxContainer : ''
                }
            >
                {this.renderCommentBox()}
                {this.renderAddNoteButton()}
            </div>
        )
    }
}

export default CommentBox
