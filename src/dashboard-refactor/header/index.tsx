import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SETTINGS_URL } from 'src/constants'
import SearchBar, { SearchBarProps } from './search-bar'
import { SyncStatusIconState } from './types'
import SyncStatusMenu, { SyncStatusMenuProps } from './sync-status-menu'
import { fonts } from '../styles'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Margin from '../components/Margin'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import type { SidebarLockedState } from '../lists-sidebar/types'
import type { HoverState } from '../types'
import { SyncStatusIcon } from './sync-status-menu/sync-status-icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

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
    z-index: 2147483641;
    box-shadow: 0px 1px 0px ${(props) => props.theme.colors.lineGrey};
`

const SearchSection = styled(Margin)<{ sidebarWidth: string }>`
    justify-content: flex-start !important;
    max-width: 825px !important;

    & > div {
        justify-content: flex-start !important;
    }
`

const RightHeader = styled.div`
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    position: absolute;
    right: 30px;
    grid-gap: 10px;

    @media screen and (max-width: 768px) {
        right: 15px;
    }
`

// const PlaceholderContainer = styled.div`
//     left: 150px;
// `

export interface HeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: HoverState
    selectedListName?: string
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: any
    activityStatus?: boolean
    sidebarWidth?: string
}

export type Props = HeaderProps & {}

function getSyncStatusIcon(status) {
    if (status === 'green') {
        return 'check'
    }
    if (status === 'yellow') {
        return 'reload'
    }

    if (status === 'red') {
        return 'warning'
    }
}

function getSyncIconColor(status) {
    if (status === 'green') {
        return 'purple'
    }
    if (status === 'yellow') {
        return 'normalText'
    }

    if (status === 'red') {
        return 'warning'
    }
}

function renderSyncStatusMenu(
    syncStatusMenuProps,
    syncStatusIconState,
    syncStatusButtonRef,
) {
    if (!syncStatusMenuProps.isDisplayed) {
        return
    }

    return (
        <PopoutBox
            targetElementRef={syncStatusButtonRef.current}
            offsetX={15}
            offsetY={5}
            closeComponent={() => syncStatusMenuProps.onToggleDisplayState()}
            placement={'bottom-end'}
        >
            <SyncStatusMenu
                {...syncStatusMenuProps}
                syncStatusIconState={syncStatusIconState}
            />
        </PopoutBox>
    )
}
export default class Header extends PureComponent<Props> {
    static SYNC_MENU_TOGGLE_BTN_CLASS = 'sync-menu-toggle-btn'

    syncStatusButtonRef = React.createRef<HTMLDivElement>()

    render() {
        const {
            searchBarProps,
            syncStatusIconState,
            syncStatusMenuProps,
            selectedListName: selectedList,
        } = this.props

        return (
            <Container>
                {/* <PlaceholderContainer /> */}
                <SearchSection
                    sidebarWidth={this.props.sidebarWidth}
                    vertical="auto"
                    left="24px"
                >
                    <SearchBar
                        {...searchBarProps}
                        sidebarLockedState={
                            this.props.sidebarLockedState.isSidebarLocked
                        }
                    />
                </SearchSection>
                <RightHeader>
                    <ActionWrapper>
                        <PrimaryAction
                            onClick={() =>
                                syncStatusMenuProps.onToggleDisplayState()
                            }
                            label={'Sync Status'}
                            size={'medium'}
                            icon={getSyncStatusIcon(syncStatusIconState)}
                            type={'tertiary'}
                            iconColor={getSyncIconColor(syncStatusIconState)}
                            spinningIcon={syncStatusIconState === 'yellow'}
                            innerRef={this.syncStatusButtonRef}
                        />
                    </ActionWrapper>
                    <Icon
                        onClick={() => window.open(SETTINGS_URL, '_self')}
                        heightAndWidth="22px"
                        padding={'6px'}
                        filePath={icons.settings}
                    />
                </RightHeader>
                {renderSyncStatusMenu(
                    syncStatusMenuProps,
                    syncStatusIconState,
                    this.syncStatusButtonRef,
                )}
            </Container>
        )
    }
}

const ActionWrapper = styled.div`
    & span {
        @media screen and (max-width: 768px) {
            display: none;
        }
    }

    & > div {
        @media screen and (max-width: 768px) {
            width: 34px;
        }
    }
`
