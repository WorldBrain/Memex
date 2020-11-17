import { MenuItemProps as DefaultMenuItemProps } from 'src/common-ui/components/dropdown-menu-btn'

export interface MenuItemProps extends DefaultMenuItemProps {
    getTextToInsert: () => string
}
