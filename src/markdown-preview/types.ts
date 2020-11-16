export interface MenuItemProps {
    name: string
    isDisabled?: boolean
    getTextToInsert: () => string
}
