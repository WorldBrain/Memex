import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SETTINGS_URL } from 'src/constants'
import SearchBar, { SearchBarProps } from './search-bar'
import { SyncStatusIconState } from './types'
import SyncStatusMenu, { SyncStatusMenuProps } from './sync-status-menu'
import styles, { fonts } from '../styles'
import { Icon } from '../styled-components'
import Margin from '../components/Margin'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import SidebarToggle from './sidebar-toggle'
import { SidebarLockedState } from '../lists-sidebar/types'
import { HoverState } from '../types'

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
    z-index: 5000;
`

const SearchSection = styled(Margin)`
    flex: 2;
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
        background-color: #e8e8e8;
    }
`

const RightHeader = styled.div`
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
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

const SyncStatusHeaderBox = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 3px;
    height: 24px;

    & > div {
        width: auto;
    }

    &:hover {
        background-color: #e8e8e8;
    }
`

const SyncStatusHeaderText = styled.span<{
    textCentered: boolean
}>`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
    font-size: 12px;
    line-height: 15px;
    white-space: nowrap;
    overflow: hidden;
    ${(props) => (props.textCentered ? 'text-align: center;' : '')}
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

const SidebarToggleBox = styled(Margin)`
    width: min-content;
`

export interface HeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: HoverState
    selectedListName?: string
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
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
                    <SidebarToggleBox horizontal="12px">
                        <SidebarToggle
                            sidebarLockedState={this.props.sidebarLockedState}
                            hoverState={this.props.sidebarToggleHoverState}
                        />
                    </SidebarToggleBox>
                    {selectedList && (
                        <CollectionTitle>{selectedList}</CollectionTitle>
                    )}
                </SidebarHeaderContainer>
                <SearchSection vertical="auto" horizontal="17px">
                    <SearchBar {...searchBarProps} />
                </SearchSection>
                <RightHeader>
                    <SyncStatusHeaderBox
                        className={Header.SYNC_MENU_TOGGLE_BTN_CLASS}
                        onClick={syncStatusMenuProps.onToggleDisplayState}
                    >
                        <Margin right="5px">
                            <SyncStatusIcon color={syncStatusIconState}>
                                {syncStatusIconState === 'red' && (
                                    <SyncStatusHeaderText textCentered>
                                        !
                                    </SyncStatusHeaderText>
                                )}
                            </SyncStatusIcon>
                        </Margin>
                        <SyncStatusHeaderText>Sync Status</SyncStatusHeaderText>
                    </SyncStatusHeaderBox>
                    <SettingsSection vertical="auto" horizontal="17px">
                        <a href={SETTINGS_URL}>
                            <Icon heightAndWidth="18px" path={icons.settings} />
                        </a>
                    </SettingsSection>
                    <SyncStatusMenu {...syncStatusMenuProps} />
                </RightHeader>
            </Container>
        )
    }
}
