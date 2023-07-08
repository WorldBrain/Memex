import React from 'react'
import styled from 'styled-components'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { shareOptsToPrivacyLvl } from 'src/annotations/utils'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/types'
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import ConfirmDialog from '../../common-ui/components/ConfirmDialog'
import {
    SELECT_SPACE_ANNOT_MSG,
    PRIVATIZE_ANNOT_MSG,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
    SELECT_SPACE_ANNOT_SUBTITLE,
    SELECT_SPACE_AFFIRM_LABEL,
    SELECT_SPACE_NEGATIVE_LABEL,
} from './constants'
import type { AnnotationSharingState } from 'src/content-sharing/background/types'
import { TaskState } from 'ui-logic-core/lib/types'

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
    autoShareState: TaskState
}

export interface Props extends ShareMenuCommonProps {
    showLink?: boolean
    isShared?: boolean
    annotationUrl: string
    shareImmediately?: boolean
    annotationData?: any
    getRemoteListIdForLocalId: (localListId: number) => string | null
    postShareHook?: (
        state: AnnotationSharingState,
        opts?: { keepListsIfUnsharing?: boolean },
    ) => void
    spacePickerProps: Pick<
        Partial<SpacePickerDependencies>,
        | 'contentSharingBG'
        | 'spacesBG'
        | 'authBG'
        | 'pageActivityIndicatorBG'
        | 'annotationsCache'
        | 'localStorageAPI'
        | 'normalizedPageUrlToFilterPageLinksBy'
    > &
        Omit<
            SpacePickerDependencies,
            | 'contentSharingBG'
            | 'spacesBG'
            | 'authBG'
            | 'pageActivityIndicatorBG'
            | 'annotationsCache'
            | 'localStorageAPI'
            | 'normalizedPageUrlToFilterPageLinksBy'
        >
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
        autoShareState: 'pristine',
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
        const {
            annotationUrl,
            contentSharingBG,
            isShared,
            showLink,
        } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        if (!link) {
            return false
        }
        this.setState({ link, showLink: showLink })
        return true
    }

    private shareAnnotation = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToLists: true,
            skipPrivacyLevelUpdate: true,
        })

        const sharingState = await contentSharingBG.setAnnotationPrivacyLevel({
            annotationUrl,
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

    private createAnnotationLink = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToLists: false,
            skipPrivacyLevelUpdate: true,
        })

        const sharingState = await contentSharingBG.setAnnotationPrivacyLevel({
            annotationUrl,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare: false,
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
        const p = executeReactStateUITask<State, 'autoShareState'>(
            this,
            'autoShareState',
            async () => {
                await this.shareAnnotation(isBulkShareProtected)
            },
        )

        await p
    }
    private handleCreateLink = async (isBulkShareProtected?: boolean) => {
        this.setState({
            shareState: 'running',
        })
        const p = executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.createAnnotationLink(isBulkShareProtected)
            },
        )

        await p

        this.setState({
            shareState: 'success',
        })
    }

    private async handleUnshare(options: {
        isBulkShareProtected?: boolean
        keepListsIfUnsharing?: boolean
    }) {
        const { annotationUrl, contentSharingBG } = this.props

        const p = executeReactStateUITask<State, 'autoShareState'>(
            this,
            'autoShareState',
            async () => {
                const sharingState = await contentSharingBG.setAnnotationPrivacyLevel(
                    {
                        annotationUrl,
                        keepListsIfUnsharing: options.keepListsIfUnsharing,
                        privacyLevel: shareOptsToPrivacyLvl({
                            shouldShare: false,
                            isBulkShareProtected: options.isBulkShareProtected,
                        }),
                    },
                )

                this.props.postShareHook?.(sharingState, {
                    keepListsIfUnsharing: options.keepListsIfUnsharing,
                })
            },
        )

        await p
    }

    private getAnnotationSharedLists = async (): Promise<string[]> => {
        let lists = []
        for (const listId of this.props.annotationData.unifiedListIds) {
            const list = await this.props.spacePickerProps.annotationsCache
                .lists.byId[listId]
            if (list.remoteId != null) {
                lists.push(list)
            }
        }

        return lists
    }

    private handleSetPrivate = async (isBulkShareProtected: boolean) => {
        if (this.props.isShared) {
            const hasSharedLists = await this.getAnnotationSharedLists()
            if (hasSharedLists.length > 0) {
                this.setState({
                    confirmationMode: {
                        type: 'public-to-private',
                        isBulkShareProtected,
                    },
                })
            } else {
                this.handleUnshare({ isBulkShareProtected })
            }
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
            this.props.getRemoteListIdForLocalId(listId) != null &&
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
        const subTitleText = SELECT_SPACE_ANNOT_SUBTITLE

        const affirmativeLabel =
            confirmationMode.type === 'public-select-space'
                ? SELECT_SPACE_AFFIRM_LABEL
                : PRIVATIZE_ANNOT_AFFIRM_LABEL
        const negativeLabel =
            confirmationMode.type === 'public-select-space'
                ? SELECT_SPACE_NEGATIVE_LABEL
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
                subTitleText={subTitleText}
                negativeLabel={negativeLabel}
                affirmativeLabel={affirmativeLabel}
                handleConfirmation={handleConfirmation}
            />
        )
    }

    render() {
        return (
            <>
                {this.state.confirmationMode == null ? (
                    <>
                        <ShareAnnotationMenu
                            link={this.state.link}
                            showLink={true}
                            onCopyLinkClick={this.handleLinkCopy}
                            linkTitleCopy="Link to this annotation"
                            privacyOptionsTitleCopy={undefined}
                            isLoading={
                                this.state.shareState === 'running' ||
                                this.state.loadState === 'running'
                            }
                            autoShareState={this.state.autoShareState}
                            handleCreateLink={this.handleCreateLink}
                            privacyOptions={[
                                {
                                    icon: 'personFine',
                                    title: 'Private',
                                    hasProtectedOption: true,
                                    onClick: this.handleSetPrivate,
                                    isSelected: !this.props.isShared,
                                    shortcut: `${SingleNoteShareMenu.MOD_KEY}+enter`,
                                    description: (
                                        <>
                                            Private to you <br /> unless shared
                                            in specific Spaces
                                        </>
                                    ),
                                },
                                {
                                    icon: 'globe',
                                    title: 'Auto-Shared',
                                    hasProtectedOption: true,
                                    onClick: this.handleSetShared,
                                    isSelected: this.props.isShared,
                                    shortcut: `shift+${SingleNoteShareMenu.MOD_KEY}+enter`,
                                    description: (
                                        <>
                                            Auto-shared to Spaces <br /> the
                                            page is added to{' '}
                                        </>
                                    ),
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

                        <SpacePicker
                            {...this.props.spacePickerProps}
                            showPageLinks
                            selectEntry={this.handleSpacePickerSelection(
                                'select',
                            )}
                            unselectEntry={this.handleSpacePickerSelection(
                                'unselect',
                            )}
                            width={'fill-available'}
                            autoFocus={false}
                        />
                    </>
                ) : (
                    this.renderConfirmationMode()
                )}
            </>
        )
    }
}
