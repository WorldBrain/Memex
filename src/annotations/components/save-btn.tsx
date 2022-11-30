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
import ConfirmDialog from 'src/common-ui/components/ConfirmDialog'
import {
    PRIVATIZE_ANNOT_MSG,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
} from 'src/overview/sharing/constants'

import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

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
    tabIndex?: number
    shortcutText?: string
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

    privacySelectionButtonRef = React.createRef<HTMLDivElement>()

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
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.privacySelectionButtonRef.current}
                placement={'bottom'}
                offsetX={15}
                closeComponent={() =>
                    this.setState({
                        confirmationMode: null,
                        isShareMenuShown: false,
                    })
                }
                // strategy={'fixed'}
                // bigClosingScreen
            >
                {this.state.confirmationMode == null ? (
                    <PrivacyOptionsContainer>
                        <PrivacyOptionsTitle>
                            Save with privacy settings
                        </PrivacyOptionsTitle>
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
                    </PrivacyOptionsContainer>
                ) : (
                    this.renderConfirmationMode()
                )}
            </PopoutBox>
        )
    }

    render() {
        return (
            <>
                <SaveBtn tabIndex={this.props.tabIndex}>
                    {this.renderShareMenu()}
                    <SaveBtnArrow
                        onClick={() =>
                            this.setState({
                                isShareMenuShown: !this.state.isShareMenuShown,
                            })
                        }
                    >
                        <Icon
                            heightAndWidth="12px"
                            filePath={icons.triangle}
                            hoverOff
                            containerRef={this.privacySelectionButtonRef}
                        />
                        {this.props.isShared ? 'Public' : 'Private'}
                    </SaveBtnArrow>
                    <TooltipBox
                        tooltipText={this.props.shortcutText}
                        placement="bottom"
                    >
                        <Icon
                            heightAndWidth="20px"
                            icon={icons.check}
                            color={'purple'}
                            onClick={() =>
                                this.props.onSave(
                                    !!this.props.isShared,
                                    !!this.props.isProtected,
                                    { mainBtnPressed: true },
                                )
                            }
                            padding={'3px 8px'}
                        />
                    </TooltipBox>
                </SaveBtn>
            </>
        )
    }
}

const PrivacyOptionsContainer = styled.div`
    padding: 10px;
`

const SaveBtnArrow = styled.div`
    width: fit-content;
    border-radius: 3px;
    z-index: 10;
    display: flex;
    padding: 0 10px 0 5px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.normalText};
    grid-gap: 5px;
    font-size: 12px;
    align-items: center;
    height: 26px;

    &:hover {
        background: ${(props) => props.theme.colors.lightHover};
    }

    & * {
        cursor: pointer;
    }
`

const SaveBtn = styled.div`
    flex-direction: row;
    align-items: center;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    background: transparent;
    border-radius: 5px;
    font-weight: 700;
    border: 1px solid ${(props) => props.theme.colors.lightHover};
    display: flex;
    flex: 1;
`

const PrivacyOptionsTitle = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 10px;
    padding-left: 5px;
`
