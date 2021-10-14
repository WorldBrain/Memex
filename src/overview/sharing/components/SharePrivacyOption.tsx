import React from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { ButtonTooltip } from 'src/common-ui/components'
import { getKeyName } from 'src/util/os-specific-key-names'

export interface Props {
    icon: IconKeys
    title: string
    shortcut: string
    description: string
    isSelected?: boolean
    hasProtectedOption?: boolean
    onClick: (isProtected?: boolean) => void
}

interface State {
    isHovered: boolean
}

class SharePrivacyOption extends React.PureComponent<Props, State> {
    state: State = { isHovered: false }

    private setHoverState = (isHovered: boolean) => () =>
        this.setState({ isHovered })

    private handleProtectedClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onClick(true)
    }

    getKeyboardShortcut = (isSelected) => {
        if (isSelected) {
            return getKeyName({key: 'alt'}) + ' + enter'
        } else {
            return getKeyName({key: 'alt'}) + ' + shift + enter'
        }

    }

    render() {
        return (
            <PrivacyOptionItem
                onClick={() => this.props.onClick(false)}
                isSelected={this.props.isSelected}
                onMouseEnter={this.setHoverState(true)}
                onMouseLeave={this.setHoverState(false)}
            >
                <Icon height="18px" icon={this.props.icon} color="primary" />
                <PrivacyOptionBox>
                    <PrivacyOptionTitleBox>
                        <PrivacyOptionTitle>
                            {this.props.title}
                        </PrivacyOptionTitle>
                        <PrivacyOptionShortcut>
                             {this.props.shortcut}
                        </PrivacyOptionShortcut>
                      </PrivacyOptionTitleBox>
                    <PrivacyOptionSubTitle>
                        {this.props.description}
                    </PrivacyOptionSubTitle>
                </PrivacyOptionBox>
                {this.props.hasProtectedOption && this.state.isHovered && (
                        <ButtonTooltip
                            tooltipText={<span><strong>Protect Status</strong><br/>No status change in bulk action.<br/><i>({this.getKeyboardShortcut(this.props.isSelected)})</i></span>}
                            position="bottomRightEdge"
                        >
                                <Icon
                                    onClick={this.handleProtectedClick}
                                    height="14px"
                                    icon="lock"
                                    color="black"
                                />
                            
                        </ButtonTooltip>
                )}
            </PrivacyOptionItem>
        )
    }
}

export default SharePrivacyOption

const PrivacyOptionItem = styled(Margin)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    cursor: pointer;
    padding: 5px 20px;
    width: fill-available;

    &:hover {
        background-color: ${colors.onHover};
    }

    &:last-child {
        margin-bottom: 0px;
    }

    &:first-child {
        margin-top: 0px;
    }

    ${(props) =>
        props.isSelected ? `background-color: ${colors.lightGrey};` : ''}
`

const PrivacyOptionBox = styled.div`
    flex: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    padding-left: 10px;
    width: 200px;
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
    white-space: nowrap;
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
`

