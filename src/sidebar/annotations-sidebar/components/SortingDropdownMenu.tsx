import React from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { Annotation } from 'src/annotations/types'
import {
    DropdownMenuBtn,
    MenuItemProps,
} from 'src/common-ui/components/dropdown-menu-btn'

interface SortingMenuItemProps extends MenuItemProps {
    sort: (a: Annotation, b: Annotation) => number
}

const sortingMenuItems: SortingMenuItemProps[] = [
    {
        name: 'Position on Page',
        sort: (a, b) => {
            return 1
        },
    },
    { name: 'Creation time (1-9)', sort: (a, b) => 1 },
    { name: 'Creation time (9-1)', sort: (a, b) => 1 },
]

interface Props {
    menuItems?: SortingMenuItemProps[]
}

export class SortingDropdownMenuBtn extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = { menuItems: sortingMenuItems }

    private handleMenuItemClick = ({ name }: SortingMenuItemProps) => {
        this.props.menuItems.sort
    }

    private renderBtn = () => <IconImg src={icons.sort} />

    render() {
        return (
            <DropdownMenuBtn
                btnChildren={this.renderBtn()}
                onMenuItemClick={this.handleMenuItemClick}
                menuItems={this.props.menuItems}
                theme={{ leftMenuOffset: '-125px' }}
            />
        )
    }
}

const IconImg = styled.img`
    height: 90%;
    width: auto;
`
