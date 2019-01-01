import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'
import TagInputContainer from './tag-input-container'

const styles = require('./comment-box-form.css')

interface Props {
    commentText: string
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLElement>
}

interface State {
    rows: number
    isTagInputActive: boolean
}

class CommentBoxForm extends React.Component<Props, State> {
    /** Ref of the text area element to listen for `scroll` events. */
    private _textAreaRef: HTMLElement
    /** Ref of the tag input element to focus on it when tabbing. */
    private _tagInputRef: HTMLElement

    state = {
        rows: constants.NUM_DEFAULT_ROWS,
        isTagInputActive: false,
    }

    componentDidMount() {
        // Auto resize text area.
        if (this._textAreaRef) {
            this._textAreaRef.addEventListener('scroll', (e: UIEvent) => {
                const targetElement = e.target as HTMLElement

                let { rows } = this.state
                while (
                    targetElement.scrollTop &&
                    rows < constants.NUM_MAX_ROWS
                ) {
                    rows += 1
                    this.setState({ rows })
                }

                this._textAreaRef.focus()
            })
        }
    }

    private _setTextAreaRef = (ref: HTMLElement) => {
        this._textAreaRef = ref
    }

    private _setTagInputRef = (ref: HTMLElement) => {
        this._tagInputRef = ref
    }

    private _handleTextAreaKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        // Save comment.
        if (e.metaKey && e.key === 'Enter') {
            this.props.saveComment(e)
        } else if (e.key === 'Tab' && !e.shiftKey) {
            this.setTagInputActive(true)
            setTimeout(() => {
                this._tagInputRef.querySelector('input').focus()
            }, 0)
        }
    }

    private _handleTagInputKeyDown = (
        e: React.KeyboardEvent<HTMLDivElement>,
    ) => {
        // Only check for `Tab` and `Shift + Tab`, handle rest of the events normally.
        if (e.key === 'Tab') {
            this.setTagInputActive(false)
        }
    }

    private _handleSaveButtonKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>,
    ) => {
        // Focus on the tag input element when `Shift + Tab` is pressed,
        // handle other events normally.
        if (e.key === 'Tab' && e.shiftKey) {
            this.setTagInputActive(true)
            setTimeout(() => {
                this._tagInputRef.querySelector('input').focus()
            }, 0)
        }
    }

    private _handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const comment = e.target.value
        const rows =
            comment.length === 0
                ? constants.NUM_DEFAULT_ROWS
                : Math.max(this.state.rows, constants.NUM_MIN_ROWS)

        if (rows !== this.state.rows) {
            this.setState({ rows })
        }

        this.props.handleCommentTextChange(comment)
    }

    setTagInputActive = (isTagInputActive: boolean) => {
        this.setState({ isTagInputActive })
    }

    render() {
        const { commentText, saveComment, cancelComment } = this.props
        const { rows, isTagInputActive } = this.state

        return (
            <React.Fragment>
                {/* Text area to get the actual comment. */}
                <textarea
                    rows={rows}
                    className={styles.textArea}
                    value={commentText}
                    placeholder="Add your comment... (save with cmd/ctrl+enter)"
                    onClick={() => this.setTagInputActive(false)}
                    onChange={this._handleChange}
                    onKeyDown={this._handleTextAreaKeyDown}
                    ref={this._setTextAreaRef}
                />
                <br />

                {/* Tags for the current annotation/comment. */}
                <div
                    onKeyDown={this._handleTagInputKeyDown}
                    ref={this._setTagInputRef}
                >
                    <TagInputContainer
                        isTagInputActive={isTagInputActive}
                        setTagInputActive={this.setTagInputActive}
                    />
                </div>

                {/* Save and Cancel buttons. */}
                <div className={styles.buttonHolder}>
                    <button
                        className={styles.saveBtn}
                        onClick={saveComment}
                        onKeyDown={this._handleSaveButtonKeyDown}
                    >
                        Save
                    </button>
                    <button
                        className={styles.cancelBtn}
                        onClick={cancelComment}
                    >
                        Cancel
                    </button>
                </div>
            </React.Fragment>
        )
    }
}

export default CommentBoxForm
