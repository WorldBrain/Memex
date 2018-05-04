import React from 'react'
import PropTypes from 'prop-types'

import styles from './CommentBox.css'

const DEFAULT_ROWS = 5
const MAX_CHARS_PER_ROW = 48

class CommentBox extends React.Component {
    static propTypes = {
        comment: PropTypes.object,
    }

    state = {
        commentInput: this.props.comment ? this.props.comment.body : '',
        isDisabled: true,
        defaultRows: DEFAULT_ROWS,
    }

    componentDidMount() {
        // Increase rows instead of having a scrollbar
        this.inputRef.addEventListener('scroll', e => {
            while (e.target.scrollTop) e.target.rows += 1
        })
        this.inputRef.focus()

        // Set the default rows for the passed comment
        if (this.props.comment) {
            const defaultRows = Math.ceil(
                this.props.comment.body.length / MAX_CHARS_PER_ROW,
            )
            this.setState({
                defaultRows,
            })
        }
    }

    handleChange = e => {
        let isDisabled = false
        const { comment } = this.props

        // Make isDisabled true if
        // 1) No comment is already present and the input field is empty
        // 2) Comment is already present and user has changed it
        if (e.target.value.length === 0) {
            isDisabled = true
            this.inputRef.rows = DEFAULT_ROWS
        } else if (comment && e.target.value === comment.body) {
            isDisabled = true
            this.inputRef.rows = this.state.defaultRows
        }
        this.setState({
            commentInput: e.target.value,
            isDisabled,
        })
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () => {
        this.inputRef.rows = this.state.defaultRows
        this.inputRef.focus()
        this.setState({
            commentInput: this.props.comment.body,
            isDisabled: true,
        })
    }

    renderCancelButton = () => {
        const { comment } = this.props
        if (comment && this.state.commentInput !== comment.body)
            return (
                <a className={styles.cancel} onClick={this.cancel}>
                    Cancel
                </a>
            )
        return null
    }

    render() {
        return (
            <div className={styles.commentBox}>
                <textarea
                    rows={this.state.defaultRows}
                    cols="40"
                    className={styles.textarea}
                    value={this.state.commentInput}
                    onChange={this.handleChange}
                    ref={this.setInputRef}
                />
                <br />
                <div className={styles.buttonHolder}>
                    {this.renderCancelButton()}
                    <button
                        className={
                            this.state.isDisabled
                                ? styles.disabled
                                : styles.button
                        }
                    >
                        {this.props.comment ? 'Update' : 'Add'}
                    </button>
                </div>
            </div>
        )
    }
}

export default CommentBox
