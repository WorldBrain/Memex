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
import type { SidebarLockedState } from '../lists-sidebar/types'
import type { HoverState } from '../types'
import ExpandAllNotes from '../search-results/components/expand-all-notes'
import { SyncStatusIcon } from './sync-status-menu/sync-status-icon'
import SearchCopyPaster, {
    Props as SearchCopyPasterProps,
} from '../search-results/components/search-copy-paster'

const Container = styled.div`
    height: ${sizeConstants.header.heightPx}px;
    width: 100%;
    position: sticky;
    top: 0;
    left: 150px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    z-index: 21474836460;
    box-shadow: 0px 1px 0px ${(props) => props.theme.colors.lineGrey};
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
    position: absolute;
    right: 10px;
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
    font-family: 'Satoshi', sans-serif;
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

const ActionButtons = styled.div``

// const PlaceholderContainer = styled.div`
//     left: 150px;
// `

export interface HeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: HoverState
    selectedListName?: string
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
    activityStatus?: boolean
}

export type Props = HeaderProps & {
    searchCopyPasterProps: SearchCopyPasterProps
    areAllNotesShown: boolean
    onShowAllNotesClick: React.MouseEventHandler
}

export default class Header extends PureComponent<Props> {
    static SYNC_MENU_TOGGLE_BTN_CLASS = 'sync-menu-toggle-btn'

    render() {
        const {
            searchBarProps,
            syncStatusIconState,
            syncStatusMenuProps,
            searchCopyPasterProps,
            selectedListName: selectedList,
        } = this.props
        return (
            <Container>
                {/* <PlaceholderContainer /> */}
                <SearchSection vertical="auto" left="24px">
                    <SearchBar
                        {...searchBarProps}
                        CopyPasterButton={
                            <SearchCopyPaster {...searchCopyPasterProps} />
                        }
                        ExpandButton={
                            <ExpandAllNotes
                                isEnabled={this.props.areAllNotesShown}
                                onClick={this.props.onShowAllNotesClick}
                            />
                        }
                    />
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
