export type MenuSeparator = '-'

export interface MenuOption {
    text: string
    link: string
    small?: boolean
    icon?: string
    top?: boolean
}

export type MenuOptions = Array<MenuOption | MenuSeparator>
