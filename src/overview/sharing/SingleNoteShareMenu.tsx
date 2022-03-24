import React from 'react'
import styled from 'styled-components'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { shareOptsToPrivacyLvl } from 'src/annotations/utils'
import { ClickAway } from 'src/util/click-away-wrapper'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import ConfirmDialog from '../../common-ui/components/ConfirmDialog'
import {
    SELECT_SPACE_ANNOT_MSG,
    PRIVATIZE_ANNOT_MSG,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
} from './constants'
import type { AnnotationSharingState } from 'src/content-sharing/background/types'

type SelectType = 'select' | 'unselect'

interface State extends ShareMenuCommonState {
    showLink: boolean
    confirmationMode:
        | null
        | { type: 'public-to-private'; isBulkShareProtected: boolean }
        | {
              type: 'public-select-space'
              listId: number
              selectType: SelectType
          }
}

export interface Props extends ShareMenuCommonProps {
    isShared?: boolean
    annotationUrl: string
    shareImmediately?: boolean
    listData: { [listId: number]: { remoteId?: string } }
    postShareHook?: (
        state: AnnotationSharingState,
        opts?: { keepListsIfUnsharing?: boolean },
    ) => void
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

                this.props.postShareHook?.(sharingState, {
                    keepListsIfUnsharing: options.keepListsIfUnsharing,
                })
            },
        )

        this.props.closeShareMenu({} as any)
        await p
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
            return this.handleUnshare({ isBulkShareProtected })
        }
    }

    private handleSpacePickerSelection = (
        selectType: 'select' | 'unselect',
    ) => async (listId: number) => {
        const { selectEntry, unselectEntry } = this.props.spacePickerProps

        if (
            this.props.isShared &&
            this.props.listData[listId]?.remoteId != null &&
            selectType === 'select'
        ) {
            this.setState({
                confirmationMode: {
                    type: 'public-select-space',
                    listId,
                    selectType,
                },
            })
        } else {
            return selectType === 'select'
                ? selectEntry(listId)
                : unselectEntry(listId)
        }
    }

    private renderConfirmationMode() {
        const { selectEntry, unselectEntry } = this.props.spacePickerProps
        const { confirmationMode } = this.state
        const text =
            confirmationMode.type === 'public-select-space'
                ? SELECT_SPACE_ANNOT_MSG
                : PRIVATIZE_ANNOT_MSG
        const affirmativeLabel =
            confirmationMode.type === 'public-select-space'
                ? undefined
                : PRIVATIZE_ANNOT_AFFIRM_LABEL
        const negativeLabel =
            confirmationMode.type === 'public-select-space'
                ? undefined
                : PRIVATIZE_ANNOT_NEGATIVE_LABEL

        const handleConfirmation = (affirmative: boolean) => () => {
            this.setState({ confirmationMode: null })

            if (confirmationMode.type === 'public-select-space') {
                const fn =
                    confirmationMode.selectType === 'select'
                        ? selectEntry
                        : unselectEntry

                return fn(confirmationMode.listId, {
                    protectAnnotation: affirmative,
                })
            } else if (confirmationMode.type === 'public-to-private') {
                return this.handleUnshare({
                    isBulkShareProtected: confirmationMode.isBulkShareProtected,
                    keepListsIfUnsharing: !affirmative,
                })
            }
        }

        return (
            <ConfirmDialog
                titleText={text}
                negativeLabel={negativeLabel}
                affirmativeLabel={affirmativeLabel}
                handleConfirmation={handleConfirmation}
            />
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
                            selectEntry={this.handleSpacePickerSelection(
                                'select',
                            )}
                            unselectEntry={this.handleSpacePickerSelection(
                                'unselect',
                            )}
                        />
                    </>
                ) : (
                    this.renderConfirmationMode()
                )}
            </ClickAway>
        )
    }
}

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
