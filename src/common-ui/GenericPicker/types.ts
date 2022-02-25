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
    selected: boolean
    focused: boolean
}

export type PickerUpdateHandler<T extends string | number = string> = (args: {
    selected: T[]
    added: T
    deleted: T
    options?: {
        protectAnnotation?: boolean
        showExternalConfirmations?: boolean
    }
}) => Promise<void>
