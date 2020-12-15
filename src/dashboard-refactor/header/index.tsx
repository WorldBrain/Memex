import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { OVERVIEW_URL } from 'src/constants'
import SearchBar, { SearchBarProps } from './search-bar'
import { SyncStatusIconState } from './types'
import SyncStatusMenu, { SyncStatusMenuProps } from './sync-status-menu'
import SidebarHeader, { SidebarHeaderProps } from './sidebar-header'
import styles, { fonts } from '../styles'
import { Icon } from '../styled-components'
import Margin from '../components/Margin'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

const Container = styled.div`
    height: 45px;
    width: 100%;
    position: fixed;
    top: 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
`

const SyncStatusHeader = styled.div`
    width: min-content
    display: flex;
    align-items: center;
    justify-content: start;
`

const SyncStatusIcon = styled.div<{
    color: SyncStatusIconState
}>`
    height: 12px;
    width: 12px;
    border-radius: 6px;
    background-color: ${(props) =>
        styles.components.syncStatusIcon.colors[props.color]};
`

const SyncStatusHeaderText = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
    font-size: 10px;
    line-height: 15px;
`

export interface HeaderProps {
    sidebarHeaderProps: SidebarHeaderProps
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
}

export default class Header extends PureComponent<HeaderProps> {
    static defaultProps = {
        searchPlaceholder: 'Search your saved pages and notes',
        pricingUrl: 'https://worldbrain.io/pricing',
        settingsIconUrl: '/img/settings.svg',
        checkedIcon: 'img/checked_green.svg',
        crossIcon: 'img/cross.svg',
        settingsRoute: '/settings',
        overviewUrl: OVERVIEW_URL,
    }

    handleSyncStatusHeaderClick = () => {
        this.props.syncStatusMenuProps.displayState.toggleDisplayState()
    }

    render() {
        const {
            sidebarHeaderProps,
            searchBarProps,
            syncStatusIconState,
            syncStatusMenuProps,
        } = this.props
        return (
            <Container>
                <SidebarHeader {...sidebarHeaderProps} />
                <SearchBar {...searchBarProps} />
                <SyncStatusHeader>
                    <SyncStatusIcon color={syncStatusIconState}>
                        <SyncStatusHeaderText>!</SyncStatusHeaderText>
                    </SyncStatusIcon>
                    <SyncStatusHeaderText>Sync Status</SyncStatusHeaderText>
                </SyncStatusHeader>
                <Margin vertical="auto" horizontal="17px">
                    <Icon heightAndWidth="18px" path="/img/settings.svg" />
                </Margin>
                <HoverBox
                    withRelativeContainer
                    width="min-content"
                    left="50px"
                    top="50px"
                >
                    <SyncStatusMenu {...syncStatusMenuProps} />
                </HoverBox>
            </Container>
        )
    }
}
