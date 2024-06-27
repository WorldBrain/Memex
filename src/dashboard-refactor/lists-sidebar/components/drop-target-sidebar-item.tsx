import React from 'react'
import SidebarItem, { Props as SidebarItemProps } from './sidebar-item'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface Props
    extends Omit<SidebarItemProps, 'dragNDropActions'>,
        Required<Pick<SidebarItemProps, 'dragNDropActions'>> {}

const DropTargetSidebarItem: React.FunctionComponent<Props> = (props) => (
    <SidebarItem
        {...props}
        renderRightSideIcon={() => {
            if (props.dragNDropActions.wasPageDropped) {
                return (
                    <Icon
                        icon="check"
                        heightAndWidth="18px"
                        color="prime1"
                        hoverOff
                    />
                )
            }
            if (props.dragNDropActions.isDraggedOver) {
                return (
                    <Icon
                        icon="plus"
                        heightAndWidth="18px"
                        color="prime1"
                        hoverOff
                    />
                )
            }
            return props.renderRightSideIcon?.() ?? null
        }}
        renderEditIcon={() => {
            return props.renderEditIcon?.() ?? null
        }}
    />
)

export default DropTargetSidebarItem
