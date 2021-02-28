import React from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import {
    sortByCreatedTime,
    sortByPagePosition,
    AnnotationsSorter,
} from '../sorting'
import {
    DropdownMenuBtn,
    MenuItemProps,
} from 'src/common-ui/components/dropdown-menu-btn'

interface SortingMenuItemProps extends MenuItemProps {
    sortingFn: AnnotationsSorter
}

export const defaultSortingMenuItems: SortingMenuItemProps[] = [
    {
        name: 'Position on Page',
        sortingFn: sortByPagePosition,
    },
    {
        name: 'Creation time (1-9)',
        sortingFn: (a, b) => sortByCreatedTime(a, b),
    },
    {
        name: 'Creation time (9-1)',
        sortingFn: (a, b) => sortByCreatedTime(b, a),
    },
]

interface Props {
    onMenuItemClick: (props: SortingMenuItemProps) => void
    menuItems?: SortingMenuItemProps[]
}

export class SortingDropdownMenuBtn extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = { menuItems: defaultSortingMenuItems }

    render() {
        return (
            <DropdownMenuContainer>
                <DropdownMenuBtn
                    btnChildren={<IconImg src={icons.sort} />}
                    onMenuItemClick={this.props.onMenuItemClick}
                    menuItems={this.props.menuItems}
                    theme={{ leftMenuOffset: '-125px' }}
                    keepSelectedState
                    tooltipProps={{
                        tooltipText: 'Sort notes',
                        position: 'bottomSidebar',
                    }}
                />
            </DropdownMenuContainer>
        )
    }
}

const DropdownMenuContainer = styled.div``

const IconImg = styled.img`
    height: 100%;
    width: auto;
`
