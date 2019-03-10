import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'
import TagsContainer from './tag-input-container'
import Tooltip from 'src/common-ui/components/tootltip'
import cx from 'classnames'

const styles = require('./comment-box-form.css')

interface Props {
    env?: 'inpage' | 'overview'
    commentText: string
    isCommentBookmarked: boolean
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLElement>
    toggleBookmark: ClickHandler<HTMLButtonElement>
}

interface State {
    rows: number
    isTagInputActive: boolean
    showTagsPicker: boolean
}

class CommentBoxForm extends React.Component<Props, State> {
    /** Ref of the text area element to listen for `scroll` events. */
    private _textAreaRef: HTMLElement
    /** Ref of the tag input element to focus on it when tabbing. */
    private _tagInputRef: HTMLElement

    state = {
        rows: constants.NUM_DEFAULT_ROWS,
        isTagInputActive: false,
        showTagsPicker: false,
    }

    componentDidMount() {
        // Auto resize text area.
        if (this._textAreaRef) {
            this._textAreaRef.focus()

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
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.props.saveComment(e)
        } else if (e.key === 'Tab' && !e.shiftKey) {
            this.setTagInputActive(true)
            setTimeout(() => {
                this._tagInputRef.querySelector('input').focus()
            }, 0)
        } else if (
            !(e.ctrlKey || e.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode))
        ) {
            e.preventDefault()
            e.stopPropagation()
            this.props.handleCommentTextChange(this.props.commentText + e.key)
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
        const {
            env,
            commentText,
            saveComment,
            cancelComment,
            toggleBookmark,
        } = this.props
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

                {/* Save and Cancel buttons. */}
                <div className={styles.footer}>
                    <div className={styles.interactions}>
                        <button
                            className={cx(styles.button, styles.tag)}
                            onClick={() =>
                                this.setState(prevState => ({
                                    showTagsPicker: !prevState.showTagsPicker,
                                }))
                            }
                            title={'Add tags'}
                        />
                        <button
                            className={cx(styles.button, {
                                [styles.bookmark]: this.props.isCommentBookmarked,
                                [styles.notBookmark]: !this.props
                                    .isCommentBookmarked,
                            })}
                            onClick={toggleBookmark}
                            title={
                                !this.props.isCommentBookmarked
                                    ? 'Bookmark'
                                    : 'Remove bookmark'
                            }
                        />
                    </div>
                    <div>
                        <button
                            className={styles.saveBtn}
                            onClick={saveComment}
                            onKeyDown={this._handleSaveButtonKeyDown}
                        >
                            Save
                        </button>
                    </div>
                </div>
               <span className={styles.tagDropdown}>
                    {this.state.showTagsPicker && (
                        <Tooltip
                            position="bottom"
                        >
                            <TagsContainer env={this.props.env} />
                        </Tooltip>
                    )}
                </span>
            </React.Fragment>
        )
    }
}

export default CommentBoxForm
