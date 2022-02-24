import React from 'react'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { shareOptsToPrivacyLvl } from 'src/annotations/utils'
import { ClickAway } from 'src/util/click-away-wrapper'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import styled from 'styled-components'

interface State extends ShareMenuCommonState {
    showLink: boolean
    confirmationMode:
        | null
        | { type: 'public-to-private'; isBulkShareProtected: boolean }
        | { type: 'public-select-space'; listId: number }
}

export interface Props extends ShareMenuCommonProps {
    isShared?: boolean
    annotationUrl: string
    shareImmediately?: boolean
    spacePickerProps: Pick<
        Partial<SpacePickerDependencies>,
        'contentSharingBG' | 'spacesBG'
    > &
        Omit<SpacePickerDependencies, 'contentSharingBG' | 'spacesBG'>
}

export default class SingleNoteShareMenu extends React.PureComponent<
    Props,
    State
> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })
    static defaultProps: Pick<
        Props,
        'contentSharingBG' | 'annotationsBG' | 'customListsBG'
    > = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
        customListsBG: runInBackground(),
    }

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
        confirmationMode: null,
    }

    async componentDidMount() {
        const linkExists = await this.setRemoteLinkIfExists()

        if (!linkExists && this.props.shareImmediately) {
            await executeReactStateUITask<State, 'loadState'>(
                this,
                'loadState',
                async () => {
                    await this.shareAnnotation()
                },
            )
        }
    }

    private handleLinkCopy = () => this.props.copyLink(this.state.link)

    private setRemoteLinkIfExists = async (): Promise<boolean> => {
        const { annotationUrl, contentSharingBG, isShared } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        if (!link) {
            return false
        }
        this.setState({ link, showLink: isShared })
        return true
    }

    private shareAnnotation = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToLists: true,
            skipPrivacyLevelUpdate: true,
        })

        const {
            remoteId,
            sharingState,
        } = await contentSharingBG.setAnnotationPrivacyLevel({
            annotation: annotationUrl,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare: true,
                isBulkShareProtected,
            }),
        })
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        await this.props.copyLink(link)

        this.props.postShareHook?.(sharingState)
        // this.props.postShareHook?.({
        //     isShared: true,
        //     isProtected: isBulkShareProtected,
        // })
    }

    private handleSetShared = async (isBulkShareProtected?: boolean) => {
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAnnotation(isBulkShareProtected)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    private async handleUnshare(options: {
        isBulkShareProtected?: boolean
        keepListsIfUnsharing?: boolean
    }) {
        const { annotationUrl, contentSharingBG } = this.props

        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                this.setState({ showLink: false })

                const {
                    sharingState,
                } = await contentSharingBG.setAnnotationPrivacyLevel({
                    annotation: annotationUrl,
                    keepListsIfUnsharing: options.keepListsIfUnsharing,
                    privacyLevel: shareOptsToPrivacyLvl({
                        shouldShare: false,
                        isBulkShareProtected: options.isBulkShareProtected,
                    }),
                })

                this.props.postShareHook?.(sharingState)
            },
        )

        this.props.closeShareMenu({} as any)
        await p
    }

    private handleSetPrivate = async (isBulkShareProtected?: boolean) => {
        if (this.props.isShared) {
            this.setState({
                confirmationMode: {
                    type: 'public-to-private',
                    isBulkShareProtected,
                },
            })
        } else {
            return this.handleUnshare({ isBulkShareProtected })
        }
    }

    private handleSpacePickerSelection = async (listId: number) => {
        if (this.props.isShared) {
            this.setState({
                confirmationMode: { type: 'public-select-space', listId },
            })
        } else {
            return this.props.spacePickerProps.selectEntry(listId)
        }
    }

    private renderConfirmationMode() {
        const { confirmationMode } = this.state
        const text =
            confirmationMode.type === 'public-select-space'
                ? 'Do you want to make this note protected?'
                : 'Do you want to remove this note from the shared spaces?'

        const handleConfirmation = (affirmative: boolean) => () => {
            this.setState({ confirmationMode: null })

            if (confirmationMode.type === 'public-select-space') {
                this.props.spacePickerProps.selectEntry(
                    confirmationMode.listId,
                    { protectAnnotation: affirmative },
                )
            } else if (confirmationMode.type === 'public-to-private') {
                this.handleUnshare({
                    isBulkShareProtected: confirmationMode.isBulkShareProtected,
                    keepListsIfUnsharing: affirmative,
                })
            }
        }

        return (
            <>
                <SectionSubTitle>{text}</SectionSubTitle>
                <ConfirmBtnRow>
                    <ConfirmBtn onClick={handleConfirmation(true)}>
                        Yes
                    </ConfirmBtn>
                    <ConfirmBtn onClick={handleConfirmation(false)}>
                        No
                    </ConfirmBtn>
                </ConfirmBtnRow>
            </>
        )
    }

    render() {
        return (
            <ClickAway onClickAway={this.props.closeShareMenu}>
                {this.state.confirmationMode == null ? (
                    <>
                        <ShareAnnotationMenu
                            link={this.state.link}
                            showLink={this.state.showLink}
                            onCopyLinkClick={this.handleLinkCopy}
                            linkTitleCopy="Link to this annotation"
                            privacyOptionsTitleCopy="Set privacy for this annotation"
                            isLoading={
                                this.state.shareState === 'running' ||
                                this.state.loadState === 'running'
                            }
                            privacyOptions={[
                                {
                                    icon: 'webLogo',
                                    title: 'Public',
                                    hasProtectedOption: true,
                                    onClick: this.handleSetShared,
                                    isSelected: this.props.isShared,
                                    shortcut: `shift+${SingleNoteShareMenu.MOD_KEY}+enter`,
                                    description:
                                        'Auto-added to Spaces the page is shared to',
                                },
                                {
                                    icon: 'person',
                                    title: 'Private',
                                    hasProtectedOption: true,
                                    onClick: this.handleSetPrivate,
                                    isSelected: !this.props.isShared,
                                    shortcut: `${SingleNoteShareMenu.MOD_KEY}+enter`,
                                    description:
                                        'Private to you, until shared (in bulk)',
                                },
                            ]}
                            shortcutHandlerDict={{
                                // 'mod+shift+enter': this.handleSetProtected,
                                'mod+shift+enter': () =>
                                    this.handleSetShared(false),
                                'mod+enter': () => this.handleSetPrivate(false),
                                'alt+enter': () => this.handleSetPrivate(true),
                                'alt+shift+enter': () =>
                                    this.handleSetShared(true),
                            }}
                        />

                        <SectionTitle>Add to Spaces</SectionTitle>
                        <SectionSubTitle>
                            Selection protected from bulk changes to privacy
                        </SectionSubTitle>
                        <SpacePicker
                            {...this.props.spacePickerProps}
                            selectEntry={this.handleSpacePickerSelection}
                        />
                    </>
                ) : (
                    this.renderConfirmationMode()
                )}
            </ClickAway>
        )
    }
}

const ConfirmBtn = styled.button``

const ConfirmBtnRow = styled.div`
    display: flex;
    flex-direction: row;
`

const SectionTitle = styled.div`
    font-size: 14px;
    font-weight: normal;
    margin-top: 10px;
    margin-bottom: 5px;
    padding-left: 15px;
    color: ${(props) => props.theme.colors.normalText};
`

const SectionSubTitle = styled.div`
    font-size: 12px;
    font-weight: 400;
    padding-left: 15px;
    color: ${(props) => props.theme.colors.lighterText};
`
