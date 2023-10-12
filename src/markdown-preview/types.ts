import { MenuItemProps as DefaultMenuItemProps } from 'src/common-ui/components/selection-menu-btn'

export interface MenuItemProps extends DefaultMenuItemProps {
    getTextToInsert: () => string
}
