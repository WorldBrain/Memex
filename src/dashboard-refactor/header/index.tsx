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
import { sizeConstants } from 'src/dashboard-refactor/constants'

const Container = styled.div`
    height: ${sizeConstants.header.heightPx}px;
    width: 100%;
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const RightHeader = styled.div`
    width: min-content;
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

const SyncStatusHeaderText = styled.span<{
    textCentered: boolean
}>`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
    font-size: 10px;
    line-height: 15px;
    white-space: nowrap;
    overflow: hidden;
    ${(props) => (props.textCentered ? 'text-align: center;' : '')}
`

export interface HeaderProps {
    sidebarHeaderProps: SidebarHeaderProps
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
}

export default class Header extends PureComponent<HeaderProps> {
    pricingUrl = 'https://worldbrain.io/pricing'
    settingsIconUrl = 'img/settings.svg'
    settingsRoute = '/settings'
    overviewUrl = OVERVIEW_URL

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
                <RightHeader>
                    <div
                        onClick={
                            syncStatusMenuProps.displayState.toggleDisplayState
                        }
                    >
                        <Margin horizontal="5px">
                            <SyncStatusIcon color={syncStatusIconState}>
                                {syncStatusIconState === 'red' && (
                                    <SyncStatusHeaderText textCentered>
                                        !
                                    </SyncStatusHeaderText>
                                )}
                            </SyncStatusIcon>
                        </Margin>
                        <SyncStatusHeaderText>Sync Status</SyncStatusHeaderText>
                    </div>
                    <Margin vertical="auto" horizontal="17px">
                        <Icon heightAndWidth="18px" path="/img/settings.svg" />
                    </Margin>
                    <SyncStatusMenu {...syncStatusMenuProps} />
                </RightHeader>
            </Container>
        )
    }
}
