import * as React from 'react'

import * as constants from '../../../comment-box/constants'
import { TagInput } from '../../../components'

const styles = require('./comment-tags-input.css')

interface Props {
    commentText: string
    handleCommentTextChange: (comment: string) => void
    tags: string[]
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
}

interface State {
    rows: number
    isTagInputActive: boolean
}

class CommentTagsInput extends React.Component<Props, State> {
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
            if (this.props.commentText.length !== 0) {
                this.setState({ rows: constants.NUM_MIN_ROWS })
            }
            this._textAreaRef.focus()

            this._textAreaRef.addEventListener('scroll', (e: UIEvent) => {
                const targetElement = e.target as HTMLElement

                let { rows: numRows } = this.state
                while (
                    targetElement.scrollTop &&
                    numRows < constants.NUM_MAX_ROWS
                ) {
                    numRows += 1
                }

                if (numRows !== this.state.rows) {
                    this.setState({ rows: numRows })
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
        if (e.key === 'Tab' && !e.shiftKey) {
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
        const { commentText, tags, addTag, deleteTag } = this.props
        const { rows, isTagInputActive } = this.state

        return (
            <React.Fragment>
                {/* Text area for the actual comment. */}
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
                    <TagInput
                        isTagInputActive={isTagInputActive}
                        setTagInputActive={this.setTagInputActive}
                        tags={tags}
                        addTag={addTag}
                        deleteTag={deleteTag}
                    />
                </div>
            </React.Fragment>
        )
    }
}

export default CommentTagsInput
