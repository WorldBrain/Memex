import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'
import TagsContainer from './tag-input-container'
import { Tooltip } from 'src/common-ui/components'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import cx from 'classnames'

const styles = require('./comment-box-form.css')

interface Props {
    env?: 'inpage' | 'overview'
    commentText: string
    isCommentBookmarked: boolean
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLButtonElement>
    toggleBookmark: ClickHandler<HTMLButtonElement>
    isAnnotation: boolean
}

interface State {
    rows: number
    isTagInputActive: boolean
    showTagsPicker: boolean
    tagSuggestions: string[]
}

class CommentBoxForm extends React.Component<Props, State> {
    /** Ref of the text area element to listen for `scroll` events. */
    private _textAreaRef: HTMLTextAreaElement
    /** Ref of the tag button element to focus on it when tabbing. */
    private tagBtnRef: HTMLElement
    private saveBtnRef: HTMLButtonElement
    private cancelBtnRef: HTMLButtonElement
    private bmBtnRef: HTMLButtonElement

    state: State = {
        rows: constants.NUM_DEFAULT_ROWS,
        isTagInputActive: false,
        showTagsPicker: false,
        tagSuggestions: [],
    }

    async componentDidMount() {
        this.attachEventListeners()
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })

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
        this._textAreaRef.focus()
    }

    componentWillUnmount() {
        this.removeEventListeners()
    }

    private attachEventListeners() {
        this.saveBtnRef.addEventListener('click', e => this.saveComment(e))
        this.cancelBtnRef.addEventListener('click', this.handleCancelBtnClick)
        this.bmBtnRef.addEventListener('click', this.handleBookmarkBtnClick)
        this.tagBtnRef.addEventListener('click', this.handleTagBtnClick)
    }

    private removeEventListeners() {
        this.saveBtnRef.removeEventListener('click', e => this.saveComment(e))
        this.cancelBtnRef.removeEventListener(
            'click',
            this.handleCancelBtnClick,
        )
        this.bmBtnRef.removeEventListener('click', this.handleBookmarkBtnClick)
        this.tagBtnRef.removeEventListener('click', this.handleTagBtnClick)
    }

    private _setTextAreaRef = (ref: HTMLTextAreaElement) => {
        this._textAreaRef = ref
    }

    private setTagButtonRef = (ref: HTMLElement) => {
        this.tagBtnRef = ref
    }

    private _handleTextAreaKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement> & { path: any },
    ) => {
        // Save comment.
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.saveComment(e)
        } else {
            if (this.handleControlEvent(e) || this.handleInputTextEvent(e)) {
                e.preventDefault()
                e.stopPropagation()
            }
        }
    }

    private handleInput(char, selectionStart, selectionEnd) {
        const textBeforeSelection = this.props.commentText.substring(
            0,
            selectionStart,
        )
        const textAfterSelection = this.props.commentText.substring(
            selectionEnd,
        )

        this.props.handleCommentTextChange(
            textBeforeSelection + char + textAfterSelection,
        )
    }

    private handleControlEvent(e: RetargetedTextElement) {
        const el = e.path[0]
        switch (e.key) {
            case 'Enter':
                this.handleInput('\n', el.selectionStart, el.selectionEnd)
                return true
            case 'ArrowLeft':
                moveSelection(el, -1)
                return true
            case 'ArrowRight':
                moveSelection(el, +1)
                return true
            case 'ArrowUp':
                // moveSelectionUp(el);
                return true
            case 'ArrowDown':
                // moveSelectionUp(el);
                return true
            case 'End':
            case 'PageDown':
                moveSelection(el, el.textLength)
                return true
            case 'Home':
            case 'PageUp':
                moveSelection(el, 0)
                return true
            // case 'Delete':
            // case 'Backspace':
            default:
                return false
        }
    }

    private handleInputTextEvent(e: RetargetedTextElement) {
        const el = e.path[0]
        // Here we take advantage of the the e.key either being a single character descriptor like 'A','?','0',etc or a key description like 'Enter', 'Backspace', etc
        const printable = e.key.length <= 1
        if (printable && !(e.ctrlKey || e.metaKey)) {
            this.handleInput(e.key, el.selectionStart, el.selectionEnd)
            return true
        }
        return false
    }

    private handleTagBtnKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Tab') {
            this.setState({
                showTagsPicker: false,
            })
            this.tagBtnRef.focus()
        }
    }

    private handleTagBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.setState(prevState => ({
            showTagsPicker: !prevState.showTagsPicker,
        }))
    }

    private handleCancelBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.props.cancelComment(e)
    }

    private handleBookmarkBtnClick = e => {
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleBookmark(e)
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

    private saveComment = e => {
        this.props.saveComment(e)
        if (this.state.showTagsPicker) {
            this.setState({
                showTagsPicker: false,
            })
        }
    }

    setTagInputActive = (isTagInputActive: boolean) => {
        this.setState({ isTagInputActive })
    }

    renderTagsTooltip() {
        if (!this.state.showTagsPicker) {
            return null
        }

        return (
            <Tooltip position="bottomLeft">
                <TagsContainer
                    env={this.props.env}
                    tagSuggestions={this.state.tagSuggestions}
                />
            </Tooltip>
        )
    }

    render() {
        const { commentText, cancelComment } = this.props
        const { rows } = this.state

        return (
            <React.Fragment>
                {/* Text area to get the actual comment. */}
                <textarea
                    rows={rows}
                    className={styles.textArea}
                    value={commentText}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onClick={() => {
                        this.setTagInputActive(false)
                        this.setState(state => ({ showTagsPicker: false }))
                    }}
                    onChange={this._handleChange}
                    onKeyDown={this._handleTextAreaKeyDown}
                    ref={this._setTextAreaRef}
                />

                {/* Save and Cancel buttons. */}
                <div className={styles.footer}>
                    <div className={styles.interactions}>
                        <button
                            ref={this.setTagButtonRef}
                            className={cx(styles.button, styles.tag)}
                            title={'Add tags'}
                        />
                        <button
                            ref={ref => (this.bmBtnRef = ref)}
                            className={cx(styles.button, {
                                [styles.bookmark]: this.props
                                    .isCommentBookmarked,
                                [styles.notBookmark]: !this.props
                                    .isCommentBookmarked,
                            })}
                            title={
                                !this.props.isCommentBookmarked
                                    ? 'Bookmark'
                                    : 'Remove bookmark'
                            }
                        />
                    </div>
                    <div className={styles.confirmButtons}>
                        <button
                            ref={ref => (this.cancelBtnRef = ref)}
                            className={styles.cancelBtn}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.saveBtn}
                            ref={ref => (this.saveBtnRef = ref)}
                        >
                            Save
                        </button>
                    </div>
                </div>
                <span
                    className={styles.tagDropdown}
                    onKeyDown={this.handleTagBtnKeyDown}
                >
                    {this.renderTagsTooltip()}
                </span>
            </React.Fragment>
        )
    }
}

function moveSelection(el: HTMLTextAreaElement, move) {
    const min = 0
    const max = el.textLength

    if (el.selectionEnd + move <= max && el.selectionStart + move >= min) {
        changeSelection(el, el.selectionStart + move)
    }
}

function changeSelection(el: HTMLTextAreaElement, selection) {
    el.selectionStart = selection
    el.selectionEnd = selection
}

type RetargetedTextElement = React.KeyboardEvent<HTMLTextAreaElement> & {
    path: HTMLTextAreaElement[]
}

export default CommentBoxForm
