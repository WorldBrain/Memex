import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SETTINGS_URL } from 'src/constants'
import SearchBar, { SearchBarProps } from './search-bar'
import { SyncStatusIconState } from './types'
import SyncStatusMenu, { SyncStatusMenuProps } from './sync-status-menu'
import { fonts } from '../styles'
import { Icon } from '../styled-components'
import Margin from '../components/Margin'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import SidebarToggle from './sidebar-toggle'
import type { SidebarLockedState } from '../lists-sidebar/types'
import type { HoverState } from '../types'
import { SyncStatusIcon } from './sync-status-menu/sync-status-icon'

const Container = styled.div`
    height: ${sizeConstants.header.heightPx}px;
    width: 100%;
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    z-index: 2147483646;
`

const SearchSection = styled(Margin)`
    justify-content: flex-start !important;
    max-width: 825px !important;

    & > div {
        justify-content: flex-start !important;
    }
`

const SettingsSection = styled(Margin)`
    width: min-content;
    cursor: pointer;
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;

    &:hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }
`

const RightHeader = styled.div`
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
`

const SyncStatusHeaderBox = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 3px;
    height: 24px;
    grid-gap: 5px;

    & > div {
        width: auto;
    }

    &:hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }

    @media screen and (max-width: 768px) {
        padding: 4px 4px 4px 4px;
        margin-left: 15px;
        width: 20px;
    }
`

const SyncStatusHeaderText = styled.span<{
    textCentered: boolean
}>`
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    ${(props) => (props.textCentered ? 'text-align: center;' : '')}

    @media screen and (max-width: 768px) {
        display: none;
    }
`

const SidebarHeaderContainer = styled.div`
    height: 100%;
    width: ${sizeConstants.listsSidebar.widthPx}px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex: 1;

    & div {
        justify-content: flex-start;
    }
`

const CollectionTitle = styled.p`
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    line-height: 21px;
    width: 100%;
    display: flex;
`

const ActivityIndicator = styled.div<{ hasActivities }>`
    border-radius: 20px;
    height: 10px;
    width: 10px;
    margin-left: -24px;
    border: ${(props) =>
        props.hasActivities
            ? '2px solid' + props.theme.colors.purple
            : '1px solid' + props.theme.colors.lightgrey};
    background: ${(props) => props.hasActivities && props.theme.colors.purple};
`

const SidebarToggleBox = styled(Margin)`
    width: fit-content;
    display: flex;
    align-items: center;
`

export interface HeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: HoverState
    selectedListName?: string
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
    activityStatus?: boolean
}

export default class Header extends PureComponent<HeaderProps> {
    static SYNC_MENU_TOGGLE_BTN_CLASS = 'sync-menu-toggle-btn'

    render() {
        const {
            searchBarProps,
            syncStatusIconState,
            syncStatusMenuProps,
            selectedListName: selectedList,
        } = this.props
        return (
            <Container>
                <SidebarHeaderContainer>
                    <SidebarToggleBox>
                        <SidebarToggle
                            sidebarLockedState={this.props.sidebarLockedState}
                            hoverState={this.props.sidebarToggleHoverState}
                        />
                        <ActivityIndicator
                            hasActivities={this.props.activityStatus}
                        />
                    </SidebarToggleBox>
                </SidebarHeaderContainer>
                <SearchSection vertical="auto" left="24px">
                    <SearchBar {...searchBarProps} />
                </SearchSection>
                <RightHeader>
                    <SyncStatusHeaderBox
                        className={Header.SYNC_MENU_TOGGLE_BTN_CLASS}
                        onClick={syncStatusMenuProps.onToggleDisplayState}
                    >
                        <Margin>
                            <SyncStatusIcon color={syncStatusIconState} />
                        </Margin>
                        <SyncStatusHeaderText>Sync Status</SyncStatusHeaderText>
                    </SyncStatusHeaderBox>
                    <SettingsSection
                        vertical="auto"
                        horizontal="17px"
                        onClick={() => window.open(SETTINGS_URL, '_self')}
                    >
                        <Icon heightAndWidth="18px" path={icons.settings} />
                    </SettingsSection>
                    <SyncStatusMenu
                        {...syncStatusMenuProps}
                        syncStatusIconState={syncStatusIconState}
                    />
                </RightHeader>
            </Container>
        )
    }
}
