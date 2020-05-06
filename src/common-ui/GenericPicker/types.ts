export type KeyEvent =
    | 'Enter'
    | 'ArrowUp'
    | 'ArrowDown'
    | ','
    | 'Tab'
    | 'Backspace'

export interface DisplayEntry {
    name: string
    selected: boolean
    focused: boolean
}

export type PickerUpdateHandler = (args: {
    selected: string[]
    added: string
    deleted: string
}) => Promise<void>
