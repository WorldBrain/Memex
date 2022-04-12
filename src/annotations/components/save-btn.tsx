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
import ConfirmDialog from 'src/common-ui/components/ConfirmDialog'
import {
    PRIVATIZE_ANNOT_MSG,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
} from 'src/overview/sharing/constants'

export interface Props {
    isShared?: boolean
    isProtected?: boolean
    hasSharedLists?: boolean
    onSave: (
        shouldShare: boolean,
        isProtected: boolean,
        opts?: {
            mainBtnPressed?: boolean
            keepListsIfUnsharing?: boolean
        },
    ) => void | Promise<void>
    renderCollectionsPicker?: () => React.ReactNode
}

interface State {
    isShareMenuShown: boolean
    confirmationMode: null | {
        type: 'public-to-private'
        isBulkShareProtected: boolean
    }
}

export default class AnnotationSaveBtn extends React.PureComponent<
    Props,
    State
> {
    static MOD_KEY = getKeyName({ key: 'mod' })

    state: State = {
        confirmationMode: null,
        isShareMenuShown: false,
    }

    componentDidMount() {
        Mousetrap.bind('mod+shift+enter', () => this.props.onSave(true, false))
        Mousetrap.bind('mod+enter', () =>
            this.props.onSave(this.props.isShared, this.props.isProtected, {
                mainBtnPressed: true,
            }),
        )
        Mousetrap.bind('alt+shift+enter', () => this.props.onSave(true, true))
        Mousetrap.bind('alt+enter', () => this.handleSetPrivate(true))
    }

    componentWillUnmount() {
        Mousetrap.unbind('mod+shift+enter')
        Mousetrap.unbind('mod+enter')
        Mousetrap.unbind('alt+shift+enter')
        Mousetrap.unbind('alt+enter')
    }

    private handleSetPrivate = async (isBulkShareProtected: boolean) => {
        if (this.props.isShared) {
            this.setState({
                confirmationMode: {
                    type: 'public-to-private',
                    isBulkShareProtected,
                },
            })
        } else {
            return this.props.onSave(
                this.props.isShared,
                isBulkShareProtected,
                { mainBtnPressed: true },
            )
        }
    }

    private saveWithShareIntent = (
        shouldShare: boolean,
        keepListsIfUnsharing?: boolean,
    ) => (isProtected?: boolean) =>
        this.props.onSave(shouldShare, isProtected, { keepListsIfUnsharing })

    private renderConfirmationMode() {
        const { confirmationMode } = this.state

        return (
            <ConfirmDialog
                titleText={PRIVATIZE_ANNOT_MSG}
                negativeLabel={PRIVATIZE_ANNOT_NEGATIVE_LABEL}
                affirmativeLabel={PRIVATIZE_ANNOT_AFFIRM_LABEL}
                handleConfirmation={(affirmative) => () => {
                    this.setState({ confirmationMode: null })

                    if (confirmationMode.type === 'public-to-private') {
                        return this.props.onSave(
                            false,
                            confirmationMode.isBulkShareProtected,
                            { keepListsIfUnsharing: !affirmative },
                        )
                    }
                }}
            />
        )
    }

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
                        this.setState({
                            confirmationMode: null,
                            isShareMenuShown: false,
                        })
                    }
                    theme={{ leftMenuOffset: '-110px' }}
                >
                    {this.state.confirmationMode == null ? (
                        <>
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
                                onClick={this.handleSetPrivate}
                                isSelected={!this.props.isShared}
                            />
                        </>
                    ) : (
                        this.renderConfirmationMode()
                    )}
                </DropdownMenuBtn>
            </HoverBox>
        )
    }

    render() {
        return (
            <>
                <SaveBtn>
                    <SaveBtnText
                        onClick={() =>
                            this.props.onSave(
                                !!this.props.isShared,
                                !!this.props.isProtected,
                                { mainBtnPressed: true },
                            )
                        }
                    >
                        <Icon
                            hoverOff
                            heightAndWidth="14px"
                            filePath={
                                getShareButtonData(
                                    this.props.isShared,
                                    this.props.isProtected,
                                    this.props.hasSharedLists,
                                ).icon
                            }
                        />{' '}
                        Save
                    </SaveBtnText>
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
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;
    border 1px solid ${(props) => props.theme.colors.lightgrey};
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
