import React from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface Props {
    title: string
    shortcut: string
    description: string
    icon: IconKeys
    onClick: React.MouseEventHandler
}

const SharePrivacyOption = (props: Props) => (
    <PrivacyOptionItem onClick={props.onClick} bottom="10px">
        <Icon height="22px" icon={props.icon} />
        <PrivacyOptionBox>
            <PrivacyOptionTitleBox>
                <PrivacyOptionTitle>{props.title}</PrivacyOptionTitle>
                <PrivacyOptionShortcut>{props.shortcut}</PrivacyOptionShortcut>
            </PrivacyOptionTitleBox>
            <PrivacyOptionSubTitle>{props.description}</PrivacyOptionSubTitle>
        </PrivacyOptionBox>
    </PrivacyOptionItem>
)

export default SharePrivacyOption

const PrivacyOptionItem = styled(Margin)`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
    cursor: pointer;
    padding: 2px 20px;
    width: fill-available;

    &:hover {
        background-color: ${colors.onHover};
    }
`

const PrivacyOptionBox = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    padding-left: 10px;
`

const PrivacyOptionTitleBox = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-direction: row;
    height: 16px;
`

const PrivacyOptionTitle = styled.div`
    font-size: 13px;
    font-weight: bold;
`

const PrivacyOptionShortcut = styled.div`
    font-size: 9px;
    font-weight: bold;
    padding-left: 5px;
`

const PrivacyOptionSubTitle = styled.div`
    font-size: 12px;
    font-weight: normal;
`
