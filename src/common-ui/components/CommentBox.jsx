import React from 'react'
import PropTypes from 'prop-types'

import styles from './CommentBox.css'

class CommentBox extends React.Component {
    static propTypes = {
        comment: PropTypes.object,
    }

    state = {
        commentInput: this.props.comment ? this.props.comment.body : '',
        isDisabled: true,
    }

    componentDidMount() {
        this.inputRef.focus()
    }

    handleChange = e => {
        let disabled = true
        const { comment } = this.props
        if (!comment && e.target.value.length > 0) disabled = false
        else if (comment && e.target.value !== comment.body) disabled = false
        this.setState({
            commentInput: e.target.value,
            isDisabled: disabled,
        })
    }

    setInputRef = node => (this.inputRef = node)

    cancel = () =>
        this.setState({
            commentInput: this.props.comment.body,
            isDisabled: true,
        })

    renderCancelButton = () => {
        if (this.props.comment && !this.state.isDisabled)
            return (
                <button
                    className={
                        this.state.isDisabled ? styles.disabled : styles.button
                    }
                    onClick={this.cancel}
                >
                    Cancel
                </button>
            )
        return null
    }

    render() {
        return (
            <div>
                <textarea
                    rows="5"
                    cols="20"
                    className={styles.textarea}
                    id="something"
                    value={this.state.commentInput}
                    onChange={this.handleChange}
                    ref={this.setInputRef}
                />
                <br />
                <button
                    className={styles.button}
                    disabled={this.state.isDisabled}
                >
                    {this.props.comment ? 'Update' : 'Add'}
                </button>

                {this.renderCancelButton()}
            </div>
        )
    }
}

export default CommentBox
