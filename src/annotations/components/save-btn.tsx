import React from 'react'
import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import SharePrivacyOption from 'src/overview/sharing/components/SharePrivacyOption'
import Mousetrap from 'mousetrap'
import ConfirmDialog from 'src/common-ui/components/ConfirmDialog'
import {
    PRIVATIZE_ANNOT_MSG,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
} from 'src/overview/sharing/constants'

import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

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
    getRootElement: () => HTMLElement
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
        // Mousetrap.bind('alt+enter', () => this.handleSetPrivate(true))
    }

    componentWillUnmount() {
        Mousetrap.unbind('mod+shift+enter')
        Mousetrap.unbind('mod+enter')
        Mousetrap.unbind('alt+shift+enter')
        // Mousetrap.unbind('alt+enter')
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
                placement={'bottom-end'}
                offsetX={5}
                closeComponent={() =>
                    this.setState({
                        confirmationMode: null,
                        isShareMenuShown: false,
                    })
                }
                getPortalRoot={this.props.getRootElement}
            >
                {this.state.confirmationMode == null ? (
                    <PrivacyOptionsContainer>
                        <PrivacyOptionsTitle>
                            Save with privacy settings
                        </PrivacyOptionsTitle>
                        <PrivacyOptionsBox>
                            <SharePrivacyOption
                                hasProtectedOption
                                icon="personFine"
                                title="Private"
                                shortcut={`${getKeyName({
                                    key: 'mod',
                                })}+enter`}
                                description={
                                    <span>
                                        Private to you
                                        <br /> until added to shared Spaces
                                    </span>
                                }
                                onClick={this.handleSetPrivate}
                                isSelected={
                                    !this.props.isShared &&
                                    !this.props.hasSharedLists
                                }
                                getRootElement={this.props.getRootElement}
                            />
                            <SharePrivacyOption
                                hasProtectedOption
                                icon="globe"
                                title="Auto-Added"
                                shortcut={`shift+${getKeyName({
                                    key: 'mod',
                                })}+enter`}
                                description={
                                    <span>
                                        Auto-added to <b>shared</b> Spaces{' '}
                                        <br />
                                        this page is shared to
                                    </span>
                                }
                                onClick={this.saveWithShareIntent(true)}
                                isSelected={this.props.isShared}
                                getRootElement={this.props.getRootElement}
                            />
                        </PrivacyOptionsBox>
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
                    <TooltipBox
                        tooltipText={
                            <SaveButtonTooltipContainer>
                                <KeyboardShortcuts
                                    keys={this.props.shortcutText.split('+')}
                                    size={'small'}
                                    getRootElement={this.props.getRootElement}
                                />
                                <BottomText>
                                    +{' '}
                                    <KeyboardShortcuts
                                        optional={'shift'}
                                        size={'small'}
                                        getRootElement={
                                            this.props.getRootElement
                                        }
                                    />
                                    to auto-add to all page Spaces
                                </BottomText>
                            </SaveButtonTooltipContainer>
                        }
                        placement="bottom-end"
                        getPortalRoot={this.props.getRootElement}
                    >
                        <PrimaryAction
                            icon={'check'}
                            onClick={() =>
                                this.props.onSave(
                                    !!this.props.isShared,
                                    !!this.props.isProtected,
                                    { mainBtnPressed: true },
                                )
                            }
                            iconColor="prime1"
                            type={'tertiary'}
                            size="small"
                            label={'Save'}
                            fontSize="14px"
                            iconSize="18px"
                            padding="2px 8px 2px 2px"
                            fontColor="greyScale7"
                        />
                    </TooltipBox>
                </SaveBtn>
            </>
        )
    }
}

const PrivacyOptionsBox = styled.div`
    display: flex;
    grid-gap: 2px;
`

const SaveButtonTooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
`
const BottomText = styled.div`
    display: flex;
    grid-gap: 3px;
`

const PrivacyOptionsContainer = styled.div`
    padding: 10px;
`

const SaveBtnArrow = styled.div`
    width: fit-content;
    border-radius: 5px 0px 0px 5px;
    z-index: 10;
    display: flex;
    padding: 0 10px 0 5px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.white};
    grid-gap: 5px;
    font-size: 12px;
    align-items: center;
    height: 26px;
    border-right: 1px solid ${(props) => props.theme.colors.greyScale3};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
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
    font-weight: 400;
    display: flex;
    flex: 1;
`

const PrivacyOptionsTitle = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: ${(props) => props.theme.colors.greyScale4};
    font-weight: 400;
    font-size: 14px;
    margin-bottom: 10px;
    padding-left: 5px;
`
