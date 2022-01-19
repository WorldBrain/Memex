export type KeyEvent =
    | 'Enter'
    | 'ArrowUp'
    | 'ArrowDown'
    | ','
    | 'Tab'
    | 'Backspace'
    | 'Escape'

export interface DisplayEntry {
    name: string
    focused: boolean
}

export type PickerUpdateHandler = (args: {
    selected: Array<string | number>
    added: string
    deleted: string
}) => Promise<void>
