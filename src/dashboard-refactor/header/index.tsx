import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { OVERVIEW_URL } from 'src/constants'
import { SearchBarProps } from './search-bar'
import { SyncStatusIconState } from './types'
import { SyncStatusMenuProps } from './sync-status-menu'
import { SidebarHeaderProps } from './sidebar-header'

const Container = styled.div`
    height: 50px;
    width: 100%;
    position: fixed;
    top: 0px;
`

export interface HeaderProps {
    sidebarHeaderProps: SidebarHeaderProps
    searchBarProps: SearchBarProps
    syncStatusMenuProps: SyncStatusMenuProps
    syncStatusIconState: SyncStatusIconState
}

export default class Header extends PureComponent<HeaderProps> {
    searchPlaceholder = 'Search keywords and/or use # to filter by tag'
    pricingUrl = 'https://worldbrain.io/pricing'
    settingsIconUrl = '/img/settings.svg'
    checkedIcon = 'img/checked_green.svg'
    crossIcon = 'img/cross.svg'
    settingsRoute = '/settings'
    overviewUrl = OVERVIEW_URL
    render() {
        return <div></div>
    }
}
