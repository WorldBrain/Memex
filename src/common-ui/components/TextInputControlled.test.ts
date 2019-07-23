import * as expect from 'expect'
import {
    SelectionModifiers,
    SelectionState,
} from 'src/common-ui/components/TextInputControlled'

const createState = (start, end, text, direction = 'forward') =>
    ({ selection: { start, end, direction }, text } as SelectionState)
const createStateWithSelection = (state, selection) => ({
    selection,
    text: state.text,
})

const expectState = (state, expectStart, expectEnd) => {
    expect(state.selection.start).toEqual(expectStart)
    expect(state.selection.end).toEqual(expectEnd)
}

describe('TextInputControlled', () => {
    it('should not move the selection forward past the end of the text for an empty string', async () => {
        let state = createState(0, 0, '')
        const selectionState = SelectionModifiers.moveSingleCursorForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 0)
    })

    it('should not move the selection forward past the end of the text for a string of length 1', async () => {
        let state = createState(0, 0, 'a')
        // Move once
        let selectionState = SelectionModifiers.moveSingleCursorForward(state)
        state = createStateWithSelection(state, selectionState)
        // Move again
        selectionState = SelectionModifiers.moveSingleCursorForward(state)
        expectState(state, 1, 1)
    })

    it('should move the selection forward until boundary', async () => {
        let state = createState(2, 3, 'abcde')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 2, 4)
        // Move again
        selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 2, 5)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 2, 5)
    })

    it('should move the selection backwards until start', async () => {
        let state = createState(2, 3, 'abcde', 'backward')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 1, 3)
        // Move again
        selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 3)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 3)
    })

    it('should move the selection backwards, changing direction', async () => {
        let state = createState(2, 3, 'abcde', 'forward')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 2, 2)
        // Move again
        selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 1, 2)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionBackward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 2)
    })

    it('should move the selection forwards, changing direction', async () => {
        let state = createState(2, 3, 'abcde', 'backward')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 3)
        // Move again
        selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 4)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionForward(state)
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 5)
    })

    it('should change the selection forward by a word, changing direction', async () => {
        let state = createState(0, 3, 'and the quick brown fox', 'backward')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 3)
        // Move again (changes direction)
        selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 7)
        // Move again
        selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 13)
        // Move again
        selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 19)
        // Move again
        selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 23)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 3, 23)
    })

    it('should change the selection backward by a word, changing direction', async () => {
        let state = createState(4, 13, 'and the quick brown fox')
        // Move once
        let selectionState = SelectionModifiers.moveSelectionBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 4, 8)
        // Move again
        selectionState = SelectionModifiers.moveSelectionBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 4, 4)
        // Move again (changes direction)
        selectionState = SelectionModifiers.moveSelectionBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 4)
        // Move again (boundary)
        selectionState = SelectionModifiers.moveSelectionBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 4)
    })

    it('should jump the cursor backward by a word', async () => {
        let state = createState(4, 13, 'and the quick brown fox')
        // Move once
        let selectionState = SelectionModifiers.jumpSingleCursorBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 4, 4)
        // Move again
        selectionState = SelectionModifiers.jumpSingleCursorBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 0)
        // Move again (boundary)
        selectionState = SelectionModifiers.jumpSingleCursorBackwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 0, 0)
    })

    it('should jump the cursor forward by a word', async () => {
        let state = createState(4, 13, 'and the quick brown fox')
        // Move once
        let selectionState = SelectionModifiers.jumpSingleCursorForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 13, 13)
        // Move again
        selectionState = SelectionModifiers.jumpSingleCursorForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 19, 19)
        // Move again
        selectionState = SelectionModifiers.jumpSingleCursorForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 23, 23)
        // Move again (boundary)
        selectionState = SelectionModifiers.jumpSingleCursorForwardByWhitespace(
            state,
        )
        state = createStateWithSelection(state, selectionState)
        expectState(state, 23, 23)
    })
})
