import React from 'react'
import styled from 'styled-components'

import SearchInjection from './SearchInjectionContainer'
// import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'
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
    color: ${(props) => props.theme.colors.normalText};
    background: ${(props) => props.theme.colors.backgroundColor};
    border: 1px solid ${(props) => props.theme.colors.lightHover};
    border-radius: 3px;
    height: 50px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 300;
    position: sticky;
    top: 20px;
    width: fill-available;
    grid-gap: 10px;
`
const SettingsContent = styled.div`
    display: flex;
    flex-direction: column;
`
