import React from 'react'
import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import SharePrivacyOption from 'src/overview/sharing/components/SharePrivacyOption'
import { getShareButtonData } from '../sharing-utils'
import Mousetrap from 'mousetrap'
import { ButtonTooltip } from 'src/common-ui/components'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

export interface Props {
    isShared?: boolean
    isProtected?: boolean
    onSave: (
        shouldShare: boolean,
        isProtected?: boolean,
    ) => void | Promise<void>
    renderCollectionsPicker?: () => React.ReactNode
}

interface State {
    isPrivacyLevelShown: boolean
    isShareMenuShown: boolean
}

export default class AnnotationSaveBtn extends React.PureComponent<
    Props,
    State
> {
    state: State = { isPrivacyLevelShown: false, isShareMenuShown: false }
    static MOD_KEY = getKeyName({ key: 'mod' })

    componentDidMount() {
        Mousetrap.bind('mod+shift+enter', () => this.props.onSave(true, false))
        Mousetrap.bind('mod+enter', () => this.props.onSave(false, false))
        Mousetrap.bind('alt+shift+enter', () => this.props.onSave(true, true))
        Mousetrap.bind('alt+enter', () => this.props.onSave(false, true))
    }

    componentWillUnmount() {
        Mousetrap.unbind('mod+shift+enter')
        Mousetrap.unbind('mod+enter')
        Mousetrap.unbind('alt+shift+enter')
        Mousetrap.unbind('alt+enter')
    }

    private get saveIcon(): string {
        return getShareButtonData(this.props.isShared, this.props.isProtected)
            .icon
    }

    private saveWithShareIntent = (shouldShare: boolean) => (
        isProtected?: boolean,
    ) => this.props.onSave(shouldShare, isProtected)

    private renderShareMenu() {
        if (!this.state.isShareMenuShown) {
            return null
        }

        return (
            <HoverBox
                withRelativeContainer
                left={'0px'}
                padding={'0px'}
                top={'5px'}
            >
                <DropdownMenuBtn
                    width={'340px'}
                    onClickOutside={() =>
                        this.setState({ isShareMenuShown: false })
                    }
                >
                    <SharePrivacyOption
                        hasProtectedOption
                        icon="webLogo"
                        title="Public"
                        shortcut={`shift+${getKeyName({
                            key: 'mod',
                        })}+enter`}
                        description="Auto-added to Spaces this page is shared to"
                        onClick={this.saveWithShareIntent(true)}
                        isSelected={this.props.isShared}
                    />
                    <SharePrivacyOption
                        hasProtectedOption
                        icon="person"
                        title="Private"
                        shortcut={`${getKeyName({
                            key: 'mod',
                        })}+enter`}
                        description="Private to you, until shared (in bulk)"
                        onClick={this.saveWithShareIntent(false)}
                        isSelected={!this.props.isShared}
                    />
                </DropdownMenuBtn>
            </HoverBox>
        )
    }

    render() {
        return (
            <>
                <SaveBtn>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText={`${AnnotationSaveBtn.MOD_KEY} + Enter`}
                    >
                        <SaveBtnText
                            onClick={() =>
                                this.props.onSave(
                                    !!this.props.isShared,
                                    !!this.props.isProtected,
                                )
                            }
                        >
                            {this.props.isShared ||
                                (this.props.isProtected && (
                                    <Icon
                                        hoverOff
                                        filePath={this.saveIcon}
                                        heightAndWidth="14px"
                                    />
                                ))}{' '}
                            Save
                        </SaveBtnText>
                    </ButtonTooltip>
                    <SaveBtnArrow horizontal="1px">
                        <Icon
                            onClick={() =>
                                this.setState({
                                    isShareMenuShown: !this.state
                                        .isShareMenuShown,
                                })
                            }
                            heightAndWidth="12px"
                            filePath={icons.triangle}
                        />
                    </SaveBtnArrow>
                </SaveBtn>
                {this.renderShareMenu()}
            </>
        )
    }
}

const SaveBtn = styled.div`
    flex-direction: row;
    align-item: center;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 0 3px 5px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;
    border 1px solid #f0f0f0;
    display: grid;
    grid-auto-flow: column;
`

const SaveBtnText = styled.span`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    display: flex;
    padding: 3px 5px 3px 10px;
    grid-auto-flow: column;
    grid-gap: 5px;
    width: fit-content;
    color: ${(props) => props.theme.colors.darkerText};

    & * {
        cursor: pointer;
    }
`

const SaveBtnArrow = styled(Margin)`
    width: 24px;
    border-radius: 3px;
    z-index: 10;
    margin: 3px 3px 3px 0px;
`
