import * as React from 'react'
import ReactDOM from 'react-dom'

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
        isTagInputActive: false,
        showTagsPicker: false,
        tagSuggestions: [],
    }

    async componentDidMount() {
        this.attachEventListeners()
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })

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

    private _setTextAreaRef = ref => {
        this._textAreaRef = ref
    }

    private setTagButtonRef = (ref: HTMLElement) => {
        this.tagBtnRef = ref
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

    onEnterSaveHandler = {
        test: e => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: e => this.saveComment(e),
    }

    render() {
        const { commentText, cancelComment } = this.props

        return (
            <React.Fragment>
                <TextArea
                    // todo: re-implement what is needed here
                    // setTextRef={this._setTextAreaRef}
                    // expandRows={true}
                    // onChangeText={this.props.handleCommentTextChange}
                    // specialHandlers={[
                    //     this.onEnterSaveHandler
                    // ]}
                    // className={styles.textArea}
                    // value={commentText}
                    // placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    // onClick={() => {
                    //     this.setTagInputActive(false)
                    //     this.setState(state => ({ showTagsPicker: false }))
                    // }}
                    onChange={this.props.handleCommentTextChange}
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

export default CommentBoxForm

// This Component exists to work-around issues with keypress events in our extension
// due to the way it's loaded in a page's DOM as react and ShadowDOM,
// and perhaps aggravated by the react-retarget work-around package too.

// Hopefully when React itself refactors it's event handling code, this temporary work-around will become obsolete
// ( https://github.com/facebook/react/issues/13525 & https://github.com/facebook/react/issues/15257 )

// The issue we face is that when typing into an un-controlled react text input in our extension
// (e.g. sidebar annotation comment), key-presses that should be exclusively characters input to the field,
// get instead picked up by keypress event handlers on that page, e.g:
// - the '?' key on github & twitter bringing up help.
// - the 't' key on our extensions shortcuts itself opening up the tagging.

// We work around this here by explicitly handling all key-presses needed for text editing on an input
// and manually acting on their intent, (e.g. just inserting a 't' character, or deleting a selection)
// then we specifically set the event to not continue propagating to other event handlers.
// These events are only listening when the component is mounted. When the component is not mounted
// a page's key handlers will continue to fire normally.

// Events that fire from the react retarget package are given a path array containing the tree
// of HTML elements that this event should come from. (real event is on shadow root, but path will
// indicate the intended element)
type ReTargetedTextElementEvent = React.KeyboardEvent<HTMLTextAreaElement> & {
    path: (HTMLElement & HTMLTextAreaElement)[]
}

interface TextAreaProps {
    onChange: (s: string) => void
    specialHandlers?: { test: (e) => boolean; handle: (e) => void }[]
}
interface TextAreaState {
    content: string
    selection: { startOffset: number; endOffset: number }
}
class TextArea extends React.Component<TextAreaProps, TextAreaState> {
    textarea: HTMLTextAreaElement

    constructor(props) {
        super(props)
        this.state = {
            content: '',
            selection: { startOffset: 0, endOffset: 0 },
        }
    }

    // -- Methods primarily to do with keeping the selection state in sync --
    componentDidMount() {
        this.registerEventListeners()
    }

    componentWillUnmount() {
        this.deRegisterEventListeners()
    }

    registerEventListeners = () => {
        this.textarea.addEventListener('select', this.selectHandler)
        this.textarea.addEventListener('click', this.clickHandler)
        this.textarea.addEventListener('focus', this.focusHandler)
        this.textarea.addEventListener('keyup', this.keyupHandler)
    }

    deRegisterEventListeners = () => {
        this.textarea.removeEventListener('select', this.selectHandler)
        this.textarea.removeEventListener('click', this.clickHandler)
        this.textarea.removeEventListener('focus', this.focusHandler)
        this.textarea.removeEventListener('keyup', this.keyupHandler)
    }

    // We keep the selection (the highlighted characters in an input box) in sync
    // with the components state, otherwise when react re-renders the component
    // the selection will be reset to the end of the text.
    selectHandler = () => this.updateSelectionState()
    clickHandler = () => this.updateSelectionState()
    focusHandler = () => this.updateSelectionState()
    keyupHandler = () => this.updateSelectionState()

    // Update the internal state representation of the text input's selection
    updateSelectionState = () =>
        this.setState({ selection: this.getSelectionFromDom() })

    // Get the selection from the HTML component
    getSelectionFromDom = () => ({
        startOffset: this.textarea.selectionStart,
        endOffset: this.textarea.selectionEnd,
    })

    // Important to keep the content (internal state + parent component handler) and the selection (internal state)
    // in sync when changes are made outside of our managed key presses, e.g. Copy/Paste.
    handleOnChange = () => {
        this.updateTextarea({
            content: this.textarea.value,
            selection: this.getSelectionFromDom(),
        })
    }

    // Set the selection from our state to the HTML component
    syncSelectionToDom = (textareaRef, selection) => {
        textareaRef.selectionStart = selection.startOffset
        textareaRef.selectionEnd = selection.endOffset
    }

    // -- Methods primarily to do with key presses --

    // The main logic intercepting key-presses
    private handleTextAreaKeyDown = (e: ReTargetedTextElementEvent) => {
        // todo need a real default here, breaks input otherwise
        // First check if we have been given a special handler to check for by the parent component
        // (e.g. Ctrl+Enter to save)
        /*        for (const specialHandler of this.props.specialHandlers) {
            if (specialHandler.test(e)) {
                specialHandler.handle(e)
                return TextArea.stopProp(e)
            }
        }*/

        // Otherwise, if we class it as a control event we handle it as such
        // Or otherwise, if we class it as an input event we handle it as such
        // stopping the propagation if either do so.
        if (this.handleControlEvent(e) || this.handleInputTextEvent(e)) {
            return TextArea.stopProp(e)
        }

        // Otherwise, we haven't done anything with the input event and it should continue propagating
        return false
    }

    // If the input event matches a control character we know how to handle, then handle it manually
    private handleControlEvent(e: ReTargetedTextElementEvent) {
        // Get the virtual target element this event was intended for, not the 'targetElement' that comes from the event
        // that is actually the shadow dom root container.
        const el = e.path[0]

        switch (e.key) {
            case 'Enter':
                this.handleInput('\n', el)
                return true
            case 'ArrowLeft':
                this.moveSelection(-1)
                return true
            case 'ArrowRight':
                this.moveSelection(+1)
                return true
            case 'ArrowUp':
                // moveSelectionUp(el);
                return true
            case 'ArrowDown':
                // moveSelectionUp(el);
                return true
            case 'End':
                this.jumpSelection(el.value.length)
                return true
            case 'PageDown':
                this.jumpSelection(el.value.length)
                return true
            case 'Home':
                this.jumpSelection(0)
                return true
            case 'PageUp':
                this.jumpSelection(0)
                return true
            case 'Delete':
                // todo: delete is slightly diff than backspace
                this.deleteInput(el)
                return true
            case 'Backspace':
                this.deleteInput(el)
                return true
            default:
                return false
        }
    }

    private handleInputTextEvent(e: ReTargetedTextElementEvent) {
        const el = e.path[0]
        // Here we take advantage of the the e.key either being a single character descriptor like 'A','?','0',etc or a key description like 'Enter', 'Backspace', etc
        const printable = e.key.length <= 1
        if (printable && !(e.ctrlKey || e.metaKey)) {
            this.handleInput(e.key, el)
            // if (this.props.expandRows) {
            //     this.handleRows(e)
            // }
            return true
        }
        // todo: can we use this if we change to keypress and get real charCodes rather than keydown  ?
        // if (event.which != 0 && event.charCode != 0)
        //      char= String.fromCharCode(event.which);

        return false
    }

    // Stop the event from propagating any further
    private static stopProp(e) {
        e.preventDefault()
        e.stopPropagation()
        return true
    }

    // todo: there was previously something to do with extending the rows, though it seemed like maybe the styles were overriding it anyway
    private handleRows(e) {
        // const comment = e.target.value
        // const rows =
        //     comment.length === 0
        //         ? constants.NUM_DEFAULT_ROWS
        //         : Math.max(this.state.rows, constants.NUM_MIN_ROWS)
        //
        // if (rows !== this.state.rows) {
        //     this.setState({ rows })
        // }
    }

    //todo: on all these make sure we don't try and set the input back or forward any more than it can, bug is with back
    private handleInput(char, el: HTMLTextAreaElement) {
        const selection = this.getSelectionFromDom()
        const text = el.value

        const textBeforeSelection = text.substring(0, selection.startOffset)
        const textAfterSelection = text.substring(selection.endOffset)
        const newText = textBeforeSelection + char + textAfterSelection

        if (selection.startOffset === selection.endOffset) {
            // If selection's are the same:
            selection.startOffset += 1
            selection.endOffset += 1
        } else {
            // If we've inserted into a selection that was multiple characters, we now reset that
            selection.endOffset = selection.startOffset + 1
            selection.startOffset = selection.startOffset + 1
        }

        this.updateTextarea({ content: newText, selection })
        this.props.onChange(this.textarea.value)
    }

    private deleteInput(el: HTMLTextAreaElement) {
        const selection = this.getSelectionFromDom()
        const text = el.value

        const textBeforeSelection = text.substring(0, selection.startOffset)
        const textAfterSelection = text.substring(selection.endOffset)
        const newText =
            selection.startOffset === selection.endOffset
                ? textBeforeSelection.substring(
                      0,
                      textBeforeSelection.length - 1,
                  ) + textAfterSelection
                : textBeforeSelection + textAfterSelection

        // Deleting one character moves the selection index back one
        if (selection.startOffset === selection.endOffset) {
            selection.startOffset--
            selection.endOffset--
        } else {
            // Otherwise the highlighted characters are deleted and the index goes to where the first char was
            selection.endOffset = selection.startOffset
        }

        this.updateTextarea({ content: newText, selection })
        this.props.onChange(this.textarea.value)
    }

    // Helper method to update the selection by an increment/decrement
    private moveSelection(move) {
        const selection = this.state.selection
        selection.endOffset += move
        selection.startOffset += move
        this.updateTextarea({ content: this.textarea.value, selection })
    }

    // Helper method to update the selection by an increment/decrement
    private jumpSelection(index) {
        const selection = this.state.selection
        selection.endOffset = index
        selection.startOffset = index
        this.updateTextarea({ content: this.textarea.value, selection })
    }

    // Helper method to update our state with intended content or selection for the textarea
    updateTextarea = ({ content, selection }) => {
        const updatedContent = content || this.textarea.value
        const updatedSelection = selection || this.getSelectionFromDom()
        this.setState(
            {
                content: updatedContent,
                selection: updatedSelection,
            },
            () => this.syncSelectionToDom(this.textarea, updatedSelection),
        )
        this.props.onChange(this.state.content)
    }

    render() {
        return (
            <textarea
                ref={c => {
                    this.textarea = c
                }}
                value={this.state.content}
                onChange={this.handleOnChange}
                onKeyDown={this.handleTextAreaKeyDown}
            />
        )
    }
}
