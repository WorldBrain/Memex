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
import * as React from 'react'
import ReactDOM from 'react-dom'

type ReTargetedTextElementEvent = React.KeyboardEvent<
    HTMLTextAreaElement & HTMLInputElement
> & {
    path: (HTMLElement & HTMLTextAreaElement & HTMLInputElement)[]
}

export interface ControlledTextInputProps {
    onChange: (s: string) => void
    specialHandlers?: { test: (e) => boolean; handle: (e) => void }[]
    updateRef?: (e: HTMLTextAreaElement | HTMLInputElement) => void
    defaultValue?: string
    type?: 'textarea' | 'input'
}
interface ControlledTextInputState {
    content: string
    selection: { startOffset: number; endOffset: number }
}
class TextInputControlled extends React.Component<
    ControlledTextInputProps & Partial<ReactDOM.IntrinsicElements.textElement>,
    ControlledTextInputState
> {
    textElement: HTMLTextAreaElement | HTMLInputElement

    static defaultProps = {
        defaultValue: '',
        specialHandlers: [],
        updateRef: null,
        type: 'textarea',
    }

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
        this.textElement.focus()

        this.updateTextElement({
            content: this.props.defaultValue,
            selection: {
                startOffset: this.props.defaultValue.length,
                endOffset: this.props.defaultValue.length,
            },
        })
    }

    componentWillUnmount() {
        this.deRegisterEventListeners()
    }

    registerEventListeners = () => {
        this.textElement.addEventListener('select', this.selectHandler)
        this.textElement.addEventListener('click', this.clickHandler)
        this.textElement.addEventListener('focus', this.focusHandler)
        this.textElement.addEventListener('keyup', this.keyupHandler)

        this.textElement.addEventListener('onChange', this.handleOnChange)
        this.textElement.addEventListener(
            'keydown',
            this.handleTextElementKeyDown,
        )
    }

    deRegisterEventListeners = () => {
        this.textElement.removeEventListener('select', this.selectHandler)
        this.textElement.removeEventListener('click', this.clickHandler)
        this.textElement.removeEventListener('focus', this.focusHandler)
        this.textElement.removeEventListener('keyup', this.keyupHandler)

        this.textElement.removeEventListener('onChange', this.handleOnChange)
        this.textElement.removeEventListener(
            'keydown',
            this.handleTextElementKeyDown,
        )
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
        startOffset: this.textElement.selectionStart,
        endOffset: this.textElement.selectionEnd,
    })

    // Important to keep the content (internal state + parent component handler) and the selection (internal state)
    // in sync when changes are made outside of our managed key presses, e.g. Copy/Paste.
    handleOnChange = () => {
        this.updateTextElement({
            content: this.textElement.value,
            selection: this.getSelectionFromDom(),
        })
    }

    // Set the selection from our state to the HTML component
    syncSelectionToDom = (textElementRef, selection) => {
        textElementRef.selectionStart = selection.startOffset
        textElementRef.selectionEnd = selection.endOffset
    }

    // -- Methods primarily to do with key presses --

    // The main logic intercepting key-presses
    private handleTextElementKeyDown = e => {
        // First check if we have been given a special handler to check for by the parent component
        // (e.g. Ctrl+Enter to save)
        for (const specialHandler of this.props.specialHandlers) {
            if (specialHandler.test(e)) {
                specialHandler.handle(e)
                return TextInputControlled.stopProp(e)
            }
        }

        // Otherwise, if we class it as a control event we handle it as such
        // Or otherwise, if we class it as an input event we handle it as such
        // stopping the propagation if either do so.
        if (this.handleControlEvent(e) || this.handleInputTextEvent(e)) {
            return TextInputControlled.stopProp(e)
        }

        // Otherwise, we haven't done anything with the input event and it should continue propagating
        return false
    }

    // If the input event matches a control character we know how to handle, then handle it manually
    private handleControlEvent(e: ReTargetedTextElementEvent) {
        switch (e.key) {
            case 'Enter':
                this.handleInput('\n')
                break
            case 'ArrowLeft':
                this.moveSelection(-1)
                break
            case 'ArrowRight':
                this.moveSelection(+1)
                break
            case 'ArrowUp':
                // todo: ArrowUp
                // moveSelectionUp(el);
                break
            case 'ArrowDown':
                // todo: ArrowDown
                // moveSelectionUp(el);
                break
            case 'End':
                this.jumpSelection(this.textElement.value.length)
                break
            case 'PageDown':
                this.jumpSelection(this.textElement.value.length)
                break
            case 'Home':
                this.jumpSelection(0)
                break
            case 'PageUp':
                this.jumpSelection(0)
                break
            case 'Backspace':
                this.handleBackspaceInput()
                break
            case 'Delete':
                // Delete if pressed without a multi char selection deletes the next char
                // Otherwise for multi char selection, functions same as backspace
                this.state.selection.endOffset ===
                this.state.selection.startOffset
                    ? this.handleDeleteInput()
                    : this.handleBackspaceInput()
                break
            default:
                return false
        }

        return true
    }

    private handleInputTextEvent(e: ReTargetedTextElementEvent) {
        // Here we take advantage of the the e.key either being a single character descriptor like 'A','?','0',etc
        // or a key description like 'Enter', 'Backspace', etc. Single chars are for input, others are not.
        if (e.key.length <= 1 && !(e.ctrlKey || e.metaKey)) {
            this.handleInput(e.key)
            return true
        }
        return false
    }

    // Stop the event from propagating any further
    private static stopProp(e) {
        e.preventDefault()
        e.stopPropagation()
        return true
    }

    private handleInput(char) {
        const selection = this.getSelectionFromDom()
        const text = this.textElement.value

        const textBeforeSelection = text.substring(0, selection.startOffset)
        const textAfterSelection = text.substring(selection.endOffset)
        const newText = textBeforeSelection + char + textAfterSelection

        // Whether a single char has been inserted in a single cursor selection or a selection of multiple characters
        // always move the offset forward by one to account for that added character.
        selection.endOffset = selection.startOffset + 1
        selection.startOffset = selection.startOffset + 1

        this.updateTextElement({ content: newText, selection })
        this.props.onChange(this.textElement.value)
    }

    private handleBackspaceInput() {
        const selection = this.getSelectionFromDom()
        const text = this.textElement.value

        const textBeforeSelection = text.substring(0, selection.startOffset)
        const textAfterSelection = text.substring(selection.endOffset)
        const newText =
            selection.startOffset === selection.endOffset
                ? textBeforeSelection.substring(
                      0,
                      textBeforeSelection.length - 1,
                  ) + textAfterSelection
                : textBeforeSelection + textAfterSelection

        // Deleting one character moves the selection index back one if it is not already at the start
        if (
            selection.startOffset === selection.endOffset &&
            selection.startOffset !== 0
        ) {
            selection.startOffset--
            selection.endOffset--
        } else {
            // Otherwise the highlighted characters are deleted and the index goes to where the first char was
            selection.endOffset = selection.startOffset
        }

        this.updateTextElement({ content: newText, selection })
        this.props.onChange(this.textElement.value)
    }

    private handleDeleteInput() {
        const selection = this.getSelectionFromDom()
        const text = this.textElement.value
        const newText =
            text.substring(0, selection.startOffset) +
            text.substring(
                Math.min(text.length, selection.endOffset + 1),
                text.length,
            )

        this.updateTextElement({ content: newText, selection })
        this.props.onChange(this.textElement.value)
    }

    // Helper method to update the selection by an increment/decrement
    private moveSelection(move) {
        const selection = this.state.selection
        selection.endOffset += move
        selection.startOffset += move
        this.updateTextElement({ content: this.textElement.value, selection })
    }

    // Helper method to jump the selection to a specific position
    private jumpSelection(index) {
        const selection = this.state.selection
        selection.endOffset = index
        selection.startOffset = index
        this.updateTextElement({ content: this.textElement.value, selection })
    }

    // Helper method to update our state with intended content or selection for the textElement
    updateTextElement = ({ content, selection }) => {
        const updatedContent = content
        const updatedSelection = selection
        this.setState(
            {
                content: updatedContent,
                selection: updatedSelection,
            },
            () => this.syncSelectionToDom(this.textElement, updatedSelection),
        )
        this.props.onChange(this.state.content)
    }

    // Update the ref here as well as any parent components that might want to use it
    updateRef = ref => {
        this.textElement = ref
        if (this.props.updateRef !== null) {
            this.props.updateRef(ref)
        }
    }

    render() {
        const {
            onChange,
            specialHandlers,
            type,
            updateRef,
            defaultValue,
            ...props
        } = this.props

        return type === 'textarea' ? (
            <textarea
                {...props}
                ref={this.updateRef}
                value={this.state.content}
            />
        ) : (
            <input
                type={'text'}
                {...props}
                ref={this.updateRef}
                value={this.state.content}
            />
        )
    }
}

export default TextInputControlled
