import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'

const styles = require('./comment-box-form.css')

interface Props {
    commentText: string
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLElement>
}

interface State {
    rows: number
}

class CommentBoxForm extends React.Component<Props, State> {
    private _textAreaRef: HTMLElement

    state = {
        rows: constants.NUM_DEFAULT_ROWS,
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

    private _handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // TODO: Implement a better logic to handle tabbing.
        if (e.metaKey && e.key === 'Enter') {
            this.props.saveComment(e)
        }
    }

    private _renderTagInput() {
        // TODO: Implement a better logic to render tags.

        // const tagObjs = this.props.tags.map(tag => ({ name: tag }))

        // if (this.props.tagInput) {
        //     return (
        //         <IndexDropdown
        //             isForAnnotation
        //             allowAdd
        //             initFilters={this.props.tags}
        //             onFilterAdd={this.props.addTag}
        //             onFilterDel={this.props.deleteTag}
        //             source="tag"
        //         />
        //     )
        // } else {
        //     return (
        //         <TagHolder
        //             tags={tagObjs}
        //             clickHandler={() => this.props.setTagInput(true)}
        //             deleteTag={({ tag }) => this.props.deleteTag(tag)}
        //         />
        //     )
        // }

        return null
    }

    private _setTextAreaRef = (ref: HTMLElement) => {
        this._textAreaRef = ref
    }

    render() {
        const { commentText, saveComment, cancelComment } = this.props
        const { rows } = this.state

        return (
            <form onSubmit={saveComment} className={styles.commentBoxForm}>
                {/* Text area to get the actual comment. */}
                <textarea
                    rows={rows}
                    className={styles.textArea}
                    value={commentText}
                    placeholder="Add your comment... (save with cmd/ctrl+enter)"
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown}
                    ref={this._setTextAreaRef}
                />
                <br />

                {/* Tags for the current annotation/comment. */}
                <div>{this._renderTagInput()}</div>

                {/* Save and Cancel buttons. */}
                <div className={styles.buttonHolder}>
                    <button className={styles.saveBtn} type="submit">
                        Save
                    </button>
                    <button
                        className={styles.cancelBtn}
                        onClick={cancelComment}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        )
    }
}

export default CommentBoxForm
