import React from 'react'
import styled from 'styled-components'

import SearchInjection from './SearchInjectionContainer'
// import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'
import BookmarkSync from './BookmarkSync'
import Ribbon from './Ribbon'
import KeyboardShortcutsContainer from './keyboard-shortcuts-container'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export default () => (
    <React.Fragment>
        <SettingsContent>
            <InformationBlock>
                <Icon
                    filePath={'warning'}
                    color={'warning'}
                    heightAndWidth={'22px'}
                    hoverOff
                />
                Changes are only applied on new tabs or when you reload existing
                tabs.
            </InformationBlock>
            <KeyboardShortcutsContainer />
            <BookmarkSync />
            <SearchInjection />
            <Tooltip />
            <Ribbon />
        </SettingsContent>
    </React.Fragment>
)

const InformationBlock = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.white};
    background: ${(props) => props.theme.colors.black};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-radius: 3px;
    height: 50px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 300;
    position: relative;
    width: fill-available;
    grid-gap: 10px;
`
const SettingsContent = styled.div`
    display: flex;
    flex-direction: column;
`
