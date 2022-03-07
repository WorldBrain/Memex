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

export interface PickerUpdateHandlerArgs<T extends string | number = string> {
    selected: T[]
    added: T
    deleted: T
    options?: {
        protectAnnotation?: boolean
        showExternalConfirmations?: boolean
    }
}

export type PickerUpdateHandler<T extends string | number = string> = (
    args: PickerUpdateHandlerArgs<T>,
) => Promise<void>
