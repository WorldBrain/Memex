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
const matchAll = require('string.prototype.matchall')

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
export interface Selection {
    start: number
    end: number
    direction: 'forward' | 'backward'
}
interface ControlledTextInputState {
    text: string
    selection: Selection
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
            text: '',
            selection: { start: 0, end: 0, direction: 'forward' },
        }
    }

    // -- Methods primarily to do with keeping the selection state in sync --
    componentDidMount() {
        this.registerEventListeners()
        this.textElement.focus()

        this.updateTextElement({
            text: this.props.defaultValue,
            selection: {
                start: this.props.defaultValue.length,
                end: this.props.defaultValue.length,
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
    updateSelectionState = () => {
        return this.setState({ selection: this.getSelectionFromDom() })
    }

    // Get the selection from the HTML component
    getSelectionFromDom = () =>
        ({
            start: this.textElement.selectionStart,
            end: this.textElement.selectionEnd,
            direction: this.textElement.selectionDirection,
        } as Selection)

    getStateFromDom = () => ({
        selection: this.getSelectionFromDom(),
        text: this.textElement.textContent,
    })

    // Important to keep the content (internal state + parent component handler) and the selection (internal state)
    // in sync when changes are made outside of our managed key presses, e.g. Copy/Paste.
    handleOnChange = e => {
        this.updateTextElement({
            text: this.textElement.value,
            selection: this.getSelectionFromDom(),
        })
    }

    // Set the selection from our state to the HTML component
    syncSelectionToDom = (textElementRef, selection) => {
        textElementRef.selectionStart = selection.start
        textElementRef.selectionEnd = selection.end
        textElementRef.selectionDirection = selection.direction
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

    // Call the given function, passing in the state, and use the result to set the selection
    private _setSelectionFrom = f => {
        this.setState({ selection: f(this.state) })
        this.syncSelectionToDom(this.textElement, this.state.selection)
    }

    // If the input event matches a control character we know how to handle, then handle it manually
    private handleControlEvent(e: ReTargetedTextElementEvent) {
        switch (e.key) {
            case 'Enter':
                this.handleInput('\n')
                break
            case 'ArrowLeft':
                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSelectionBackwardByWhitespace,
                    )
                } else if (e.ctrlKey || e.metaKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.jumpSingleCursorBackwardByWhitespace,
                    )
                } else if (e.shiftKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSelectionBackward,
                    )
                } else {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSingleCursorBackward,
                    )
                }
                break
            case 'ArrowRight':
                if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSelectionForwardByWhitespace,
                    )
                } else if (e.ctrlKey || e.metaKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.jumpSingleCursorForwardByWhitespace,
                    )
                } else if (e.shiftKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSelectionForward,
                    )
                } else {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSingleCursorForward,
                    )
                }
                break
            case 'ArrowUp':
                this._setSelectionFrom(SelectionModifiers.jumpSingleCursorUp)
                break
            case 'ArrowDown':
                this._setSelectionFrom(SelectionModifiers.jumpSingleCursorDown)
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
                if (e.ctrlKey || e.metaKey) {
                    this._setSelectionFrom(
                        SelectionModifiers.moveSelectionBackwardByWhitespace,
                    )
                }
                this.handleBackspaceInput()
                break
            case 'Delete':
                // Delete if pressed without a multi char selection deletes the next char
                // Otherwise for multi char selection, functions same as backspace
                this.state.selection.end === this.state.selection.start
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

        const textBeforeSelection = text.substring(0, selection.start)
        const textAfterSelection = text.substring(selection.end)
        const newText = textBeforeSelection + char + textAfterSelection

        // Whether a single char has been inserted in a single cursor selection or a selection of multiple characters
        // always move the offset forward by one to account for that added character.
        selection.end = selection.start + 1
        selection.start = selection.start + 1

        this.updateTextElement({ text: newText, selection })
    }

    private handleBackspaceInput() {
        const selection = this.getSelectionFromDom()
        const text = this.textElement.value

        const textBeforeSelection = text.substring(0, selection.start)
        const textAfterSelection = text.substring(selection.end)
        const newText =
            selection.start === selection.end
                ? textBeforeSelection.substring(
                      0,
                      textBeforeSelection.length - 1,
                  ) + textAfterSelection
                : textBeforeSelection + textAfterSelection

        // Deleting one character moves the selection index back one if it is not already at the start
        if (selection.start === selection.end && selection.start !== 0) {
            selection.start--
            selection.end--
        } else {
            // Otherwise the highlighted characters are deleted and the index goes to where the first char was
            selection.end = selection.start
        }

        this.updateTextElement({ text: newText, selection })
    }

    private handleDeleteInput() {
        const selection = this.getSelectionFromDom()
        const text = this.textElement.value
        const newText =
            text.substring(0, selection.start) +
            text.substring(
                Math.min(text.length, selection.end + 1),
                text.length,
            )

        this.updateTextElement({ text: newText, selection })
    }

    // Helper method to jump the selection to a specific position
    private jumpSelection(index) {
        const selection = this.state.selection
        selection.end = index
        selection.start = index
        this.updateTextElement({ text: this.textElement.value, selection })
    }

    // Helper method to update our state with intended content or selection for the textElement
    updateTextElement = ({ text, selection }) => {
        const updatedContent = text
        const updatedSelection = selection
        this.setState(
            {
                text: updatedContent,
                selection: updatedSelection,
            },
            () => this.syncSelectionToDom(this.textElement, updatedSelection),
        )
        if (this.props.onChange) {
            this.props.onChange(updatedContent)
        }
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
                value={this.state.text}
                onChange={this.handleOnChange}
            />
        ) : (
            <input
                type={'text'}
                {...props}
                ref={this.updateRef}
                value={this.state.text}
                onChange={this.handleOnChange}
            />
        )
    }
}

export interface SelectionState {
    selection: Selection
    text: string
}

export class SelectionModifiers {
    static _clamp(min, max, val) {
        return Math.min(Math.max(val, min), max)
    }

    static _addBounded(
        state: SelectionState,
        add: number,
        which: 'start' | 'end',
    ) {
        const result = state.selection[which] + add
        const min = 0
        const max = state.text.length
        return SelectionModifiers._clamp(min, max, result)
    }

    static _addBoundedBoth(state: SelectionState, add: number) {
        return {
            ...state.selection,
            start: SelectionModifiers._addBounded(state, add, 'start'),
            end: SelectionModifiers._addBounded(state, add, 'end'),
        }
    }

    static _selectionToMoveForForwardMovements(current: SelectionState) {
        const newSelection = { ...current.selection }
        if (current.selection.start === current.selection.end) {
            newSelection.direction = 'forward'
        }
        const cursorToMove =
            newSelection.direction === 'forward' ? 'end' : 'start'
        return { newSelection, cursorToMove } as {
            newSelection: Selection
            cursorToMove: 'start' | 'end'
        }
    }

    static _selectionToMoveForBackwardMovements(current: SelectionState) {
        const newSelection = { ...current.selection }
        if (current.selection.start === current.selection.end) {
            newSelection.direction = 'backward'
        }
        const cursorToMove =
            newSelection.direction === 'backward' ? 'start' : 'end'
        return { newSelection, cursorToMove } as {
            newSelection: Selection
            cursorToMove: 'start' | 'end'
        }
    }

    static moveSingleCursorForward(current: SelectionState): Selection {
        current.selection.start = current.selection.end
        return SelectionModifiers._addBoundedBoth(current, +1)
    }

    static moveSingleCursorBackward(current: SelectionState): Selection {
        current.selection.end = current.selection.start
        return SelectionModifiers._addBoundedBoth(current, -1)
    }

    static moveSelectionForward(current: SelectionState): Selection {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForForwardMovements(current)
        newSelection[cursorToMove] = SelectionModifiers._addBounded(
            current,
            +1,
            cursorToMove,
        )
        return newSelection
    }

    static moveSelectionBackward(current: SelectionState): Selection {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForBackwardMovements(current)
        newSelection[cursorToMove] = SelectionModifiers._addBounded(
            current,
            -1,
            cursorToMove,
        )
        return newSelection
    }

    static _lastWhitespace(current: SelectionState, cursorToMove: string) {
        const lastWhitespaces: RegExpMatchArray = matchAll(
            current.text.substr(0, current.selection[cursorToMove] - 1),
            /(\s)/gm,
        )
        const lastWhitespaceArray = [...lastWhitespaces]
        if (lastWhitespaceArray.length === 0) {
            return 0
        }
        return lastWhitespaceArray[lastWhitespaceArray.length - 1]['index'] + 1
    }

    static _nextWhitespace(current: SelectionState, cursorToMove: string) {
        const nextWhitespaces = matchAll(
            current.text.substr(current.selection[cursorToMove] + 1),
            /(\s)/gm,
        )
        const nextWhitespaceArray = [...nextWhitespaces] as RegExpMatchArray
        if (nextWhitespaceArray.length === 0) {
            return current.text.length
        }
        return (
            current.selection[cursorToMove] +
            nextWhitespaceArray[0]['index'] +
            1
        )
    }

    static moveSelectionBackwardByWhitespace(current: SelectionState) {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForBackwardMovements(current)
        newSelection[cursorToMove] = SelectionModifiers._lastWhitespace(
            current,
            cursorToMove,
        )
        return newSelection
    }

    static moveSelectionForwardByWhitespace(current: SelectionState) {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForForwardMovements(current)
        newSelection[cursorToMove] = SelectionModifiers._nextWhitespace(
            current,
            cursorToMove,
        )
        return newSelection
    }

    static jumpSingleCursorBackwardByWhitespace(
        current: SelectionState,
    ): Selection {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForBackwardMovements(current)

        if (current.selection.start !== current.selection.end) {
            newSelection.end = current.selection.start
            return newSelection
        } else {
            const cursor = SelectionModifiers._lastWhitespace(
                current,
                cursorToMove,
            )
            newSelection.start = cursor
            newSelection.end = cursor
            return newSelection
        }
    }

    static jumpSingleCursorForwardByWhitespace(
        current: SelectionState,
    ): Selection {
        const {
            newSelection,
            cursorToMove,
        } = SelectionModifiers._selectionToMoveForForwardMovements(current)

        if (current.selection.start !== current.selection.end) {
            newSelection.start = current.selection.end
            return newSelection
        } else {
            const cursor = SelectionModifiers._nextWhitespace(
                current,
                cursorToMove,
            )
            newSelection.start = cursor
            newSelection.end = cursor
            return newSelection
        }
    }

    static _distanceFromNewLine(current: SelectionState): number {
        // find either a newline or the start if no prev newline
        const lastNewline = current.text
            .substr(0, current.selection.end)
            .lastIndexOf('\n')
        return lastNewline === -1
            ? current.selection.end
            : current.selection.end - lastNewline - 1
    }

    static _indexOfPreviousLine(current: SelectionState): number {
        // find either a newline or the start if no prev newline
        let previousNewLine = current.text
            .substr(0, current.selection.end)
            .lastIndexOf('\n')
        if (previousNewLine === -1) {
            return 0
        } else {
            // If we're on a newline boundary, actually find the one before
            previousNewLine = current.text
                .substr(0, previousNewLine)
                .lastIndexOf('\n')
        }

        return previousNewLine === -1 ? 0 : previousNewLine + 1
    }

    static _indexOfNextLine(current: SelectionState): number {
        const nextNewLine = current.text.indexOf('\n', current.selection.end)
        return nextNewLine === -1 ? current.text.length : nextNewLine + 1
    }

    static _newlineIndexes(
        text: string,
    ): {
        start: number
        text: string
        newline: string
        length: number
    }[] {
        const regexp = /([^\r^\n]*)(\r\n|\n|\r)?/gm
        // @ts-ignore
        const matches = matchAll(text, regexp)
        // console.log("matches",Array.from(matches))

        const lines = Array.from(matches, (m: any) => ({
            start: m.index,
            text: m[1],
            newline: m[2],
            length: typeof m[1] !== 'undefined' ? m[1].length : 0,
        }))
        return lines
    }

    static _currentLine(lines, index) {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (index >= lines[i].start) {
                return i
            }
        }
        return 0
    }

    static jumpSingleCursorUp(current: SelectionState): Selection {
        const newSelection = { ...current.selection }

        if (current.selection.start !== current.selection.end) {
            newSelection.start = current.selection.end
            return newSelection
        } else {
            let cursor: number
            const lines = SelectionModifiers._newlineIndexes(current.text)
            const currentLineIndex = SelectionModifiers._currentLine(
                lines,
                current.selection.start,
            )
            const currentLineDistance =
                current.selection.start - lines[currentLineIndex].start

            if (currentLineIndex === 0) {
                cursor = 0
            } else {
                const prevLine = lines[currentLineIndex - 1]
                cursor = SelectionModifiers._clamp(
                    prevLine.start,
                    prevLine.start + prevLine.length + 1,
                    prevLine.start + currentLineDistance,
                )
            }

            newSelection.start = cursor
            newSelection.end = cursor
            return newSelection
        }
    }

    static jumpSingleCursorDown(current: SelectionState): Selection {
        const newSelection = { ...current.selection }

        if (current.selection.start !== current.selection.end) {
            newSelection.start = current.selection.end
            return newSelection
        } else {
            let cursor: number
            const lines = SelectionModifiers._newlineIndexes(current.text)
            const currentLineIndex = SelectionModifiers._currentLine(
                lines,
                current.selection.start,
            )
            const currentLineDistance =
                current.selection.start - lines[currentLineIndex].start

            if (currentLineIndex === lines.length - 1) {
                cursor =
                    lines[currentLineIndex].start +
                    lines[currentLineIndex].length
            } else {
                const nextLine = lines[currentLineIndex + 1]
                cursor = SelectionModifiers._clamp(
                    nextLine.start,
                    nextLine.start + nextLine.length + 1,
                    nextLine.start + currentLineDistance,
                )
            }

            newSelection.start = cursor
            newSelection.end = cursor
            return newSelection
        }
    }
}

export default TextInputControlled
