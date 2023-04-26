import React from 'react'
import SidebarItem, { Props as SidebarItemProps } from './sidebar-item'

export interface Props
    extends Omit<
        SidebarItemProps,
        | 'dropReceivingState'
        | 'isCollaborative'
        | 'isSelected'
        | 'renderLeftSideIcon'
        | 'renderRightSideIcon'
    > {}

const FollowedListSidebarItem: React.FunctionComponent<Props> = (props) => (
    <SidebarItem {...props} isSelected={false} />
)

export default FollowedListSidebarItem
