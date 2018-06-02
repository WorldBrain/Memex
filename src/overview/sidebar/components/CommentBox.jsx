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
        isDisabled: true,
        textareaRows: constants.DEFAULT_ROWS,
        minimized: true,
    }

    componentDidMount() {
        // Increase rows instead of having a scrollbar
        this.inputRef.focus()
        this.inputRef.addEventListener('scroll', e => {
            while (e.target.scrollTop) e.target.rows += 1
        })
    }

    handleChange = e => {
        let { isDisabled, minimized, textareaRows } = this.state
        const comment = e.target.value

        if (comment.length === 0) {
            isDisabled = true
            textareaRows = constants.DEFAULT_ROWS
        } else if (minimized) {
            minimized = false
            textareaRows = constants.MAXED_ROWS
        }

        this.setState({
            commentInput: comment,
            isDisabled,
            textareaRows,
        })
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () => {
        this.inputRef.rows = this.state.textareaRows
        this.inputRef.focus()
        this.setState({
            commentInput: '',
            isDisabled: true,
            textareaRows: constants.DEFAULT_ROWS,
        })
    }

    save = () => {
        const { commentInput } = this.state
        if (commentInput.length) this.props.saveComment()
    }

    renderCancelButton = () => {
        return (
            <a className={styles.cancel} onClick={this.cancel}>
                Cancel
            </a>
        )
    }

    render() {
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
}

export default CommentBox
