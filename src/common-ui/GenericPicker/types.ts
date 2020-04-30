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
