import React from 'react'
import styled from 'styled-components'
import SidebarItem, { Props as SidebarItemProps } from './sidebar-item'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface Props
    extends Omit<
        SidebarItemProps,
        'dropReceivingState' | 'isCollaborative' | 'renderLeftSideIcon'
    > {
    icon: IconKeys
}

const StaticSidebarItem: React.FunctionComponent<Props> = (props) => (
    <SidebarItem
        {...props}
        alwaysShowRightSideIcon
        renderLeftSideIcon={() => (
            <IconContainer>
                <Icon
                    icon={props.icon}
                    heightAndWidth="18px"
                    hoverOff
                    color={props.isSelected ? 'prime1' : null}
                />
            </IconContainer>
        )}
        renderRightSideIcon={() =>
            props.renderRightSideIcon ? (
                <IconContainer>{props.renderRightSideIcon()}</IconContainer>
            ) : null
        }
    />
)

export default StaticSidebarItem

const IconContainer = styled.div`
    margin-left: 10px;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`
