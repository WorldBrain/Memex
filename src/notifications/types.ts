export interface ActionDefinition {
    /** Type of the button the button, it can be go-to-url etc. */
    type: string
    /** Url of the button if the button is to open a new link */
    url?: string
    /** It is used for open the new tab or self tab {new-tab|self} */
    context?: 'new-tab' | 'self'
    /** Key when we need to use the variable of the local storage */
    key?: string
}

export interface ButtonDefinition {
    action?: ActionDefinition
    label: string
}

export interface NotifDefinition {
    /** Should be unique (feature_name + notification + incNumber) */
    id: string
    /** Title of the notifications - Do not support html tags */
    title: string
    /** Message in the text - It supports html tags (for example h1, i, b) */
    message: string
    /** Buttons that will be present in the notifications
     * It can be any action button or link button
     */
    buttons?: ButtonDefinition[]
}

export interface Notification extends NotifDefinition {
    isRead?: boolean
}
