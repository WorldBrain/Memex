export type KeyEvent =
    | 'Enter'
    | 'ArrowUp'
    | 'ArrowDown'
    | ','
    | 'Tab'
    | 'Backspace'
    | 'Escape'

export interface DisplayEntry {
    localId: string | number
    remoteId: string | number | null
    name: string
    focused: boolean
}

export type PickerUpdateHandler = (args: {
    selected: Array<string | number>
    added: string | number
    deleted: string | number
}) => Promise<void>
