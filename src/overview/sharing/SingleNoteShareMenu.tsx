import React from 'react'
import styled, { css } from 'styled-components'

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
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { trackSharedAnnotation } from '@worldbrain/memex-common/lib/analytics/events'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import Checkbox from 'src/common-ui/components/Checkbox'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Margin from '@worldbrain/memex-common/lib/common-ui/components/Margin'

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
    autoCreateLinkState: TaskState
    autoCreateLinkSetting: boolean
    isAutoAddEnabled: boolean
    showAutoAddMenu: boolean
}

export interface Props extends ShareMenuCommonProps {
    showLink?: boolean
    isShared?: boolean
    annotationUrl: string
    analyticsBG?: AnalyticsCoreInterface
    shareImmediately?: boolean
    annotationData?: any
    syncSettingsBG?: RemoteSyncSettingsInterface
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
        | 'localStorageAPI'
        | 'normalizedPageUrlToFilterPageLinksBy'
    > &
        Omit<
            SpacePickerDependencies,
            | 'contentSharingBG'
            | 'spacesBG'
            | 'authBG'
            | 'pageActivityIndicatorBG'
            | 'localStorageAPI'
            | 'normalizedPageUrlToFilterPageLinksBy'
        >
    getRootElement: () => HTMLElement
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
    private autoAddButtonRef: React.RefObject<HTMLDivElement>

    private syncSettings: SyncSettingsStore<'extension'>

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
        autoShareState: 'pristine',
        confirmationMode: null,
        autoCreateLinkState: 'pristine',
        autoCreateLinkSetting: null,
        isAutoAddEnabled: null,
        showAutoAddMenu: false,
    }

    async componentDidMount() {
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.props.syncSettingsBG,
        })
        this.setState({
            autoCreateLinkState: 'running',
        })

        this.autoAddButtonRef = React.createRef<HTMLDivElement>()

        const isAutoAddEnabled = await this.getAutoAddSetting()

        if (isAutoAddEnabled == null) {
            this.setState({ isAutoAddEnabled: true })
            await this.setAutoAddSetting(true)
        } else {
            this.setState({ isAutoAddEnabled })
        }

        let existingSetting = await this.syncSettings.extension.get(
            'shouldAutoCreateNoteLink',
        )
        if (existingSetting == null) {
            await this.syncSettings.extension.set(
                'shouldAutoCreateNoteLink',
                false,
            )
            existingSetting = false
        }

        this.setState({
            autoCreateLinkState: 'success',
            autoCreateLinkSetting: existingSetting,
        })

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

    async setAutoAddSetting(isAutoAddEnabled: boolean) {
        return this.syncSettings.extension.set(
            'shouldAutoAddSpaces',
            isAutoAddEnabled,
        )
    }

    async getAutoAddSetting() {
        return this.syncSettings.extension.get('shouldAutoAddSpaces')
    }

    async toggleAutoAdd() {
        const next = !this.state.isAutoAddEnabled
        this.setState({ isAutoAddEnabled: next })
        await this.setAutoAddSetting(next)
    }

    renderAutoAddDefaultSettings() {
        if (this.state.showAutoAddMenu) {
            return (
                <PopoutBox
                    targetElementRef={this.autoAddButtonRef?.current}
                    placement="bottom"
                    width="320px"
                    closeComponent={() =>
                        this.setState({ showAutoAddMenu: false })
                    }
                    // offsetY={-100}
                    // offsetX={-100}
                    instaClose
                    getPortalRoot={this.props.getRootElement}
                >
                    <AutoAddDefaultContainer>
                        <DefaultCheckBoxContainer>
                            <Checkbox
                                key={33}
                                id={'33'}
                                width="fit-content"
                                isChecked={this.state.isAutoAddEnabled === true}
                                handleChange={() => this.toggleAutoAdd()}
                                // isDisabled={!this.state.shortcutsEnabled}
                                name={
                                    this.state.isAutoAddEnabled
                                        ? 'Is Default'
                                        : 'Make Default'
                                }
                                label={
                                    'Auto-adding default for new annotations'
                                }
                                fontSize={14}
                                size={14}
                                isLoading={this.state.isAutoAddEnabled == null}
                            />
                        </DefaultCheckBoxContainer>
                        <TooltipTextBox>
                            {this.props.isShared ? (
                                <>
                                    <strong>
                                        <Icon
                                            icon={'spread'}
                                            color={'prime1'}
                                            hoverOff
                                            heightAndWidth="32px"
                                        />
                                        Added to all Spaces the document is in.
                                    </strong>
                                    For generally relevant annotations.
                                    <KeyboardShortCutBox>
                                        Do not add to all Spaces by using
                                        <KeyboardShortcuts
                                            keys={`shift+${SingleNoteShareMenu.MOD_KEY}+enter`.split(
                                                '+',
                                            )}
                                            size={'small'}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                        />
                                    </KeyboardShortCutBox>
                                </>
                            ) : (
                                <>
                                    <strong>
                                        Only added to Spaces
                                        <br />
                                        you manually put annotation in.
                                    </strong>
                                    <span>
                                        For context specific annotations.
                                        <br />
                                        Setting auto-disables when you select
                                        Spaces for indiviudal annotations.
                                    </span>
                                    <KeyboardShortCutBox>
                                        Save & Auto-Add to all Spaces the page
                                        is in
                                        <KeyboardShortcuts
                                            keys={`shift+${SingleNoteShareMenu.MOD_KEY}+enter`.split(
                                                '+',
                                            )}
                                            size={'small'}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                        />
                                    </KeyboardShortCutBox>
                                </>
                            )}
                        </TooltipTextBox>
                    </AutoAddDefaultContainer>
                </PopoutBox>
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
        const {
            annotationUrl,
            contentSharingBG,
            spacePickerProps: { annotationsCache },
        } = this.props
        let sharingState = await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToParentPageLists: true,
            skipPrivacyLevelUpdate: true,
        })
        const annotData = annotationsCache.getAnnotationByLocalId(annotationUrl)
        if (annotData) {
            annotationsCache.updateAnnotation({
                ...annotData,
                remoteId: sharingState.remoteId!.toString(),
            })
        }

        sharingState = await contentSharingBG.setAnnotationPrivacyLevel({
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
            shareToParentPageLists: false,
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

    toggleAutoCreateLinkSetting = async () => {
        const existingSetting = this.state.autoCreateLinkSetting

        await this.syncSettings.extension.set(
            'shouldAutoCreateNoteLink',
            !existingSetting,
        )
        this.setState({
            autoCreateLinkSetting: !existingSetting,
        })
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

        if (this.props.analyticsBG) {
            try {
                await trackSharedAnnotation(this.props.analyticsBG, {
                    type: 'single',
                })
            } catch (error) {
                console.error(
                    `Error tracking single annotation link share event', ${error}`,
                )
            }
        }

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
            const list = this.props.spacePickerProps.annotationsCache.lists
                .byId[listId]
            if (list.remoteId != null) {
                lists.push(list)
            }
        }

        return lists
    }

    private handleSetPrivate = async (isBulkShareProtected: boolean) => {
        return this.handleUnshare({
            isBulkShareProtected,
            keepListsIfUnsharing: true,
        })

        // may bring it back so lets leave this here

        // if (this.props.isShared) {
        //     const hasSharedLists = await this.getAnnotationSharedLists()
        //     if (hasSharedLists.length > 0) {
        //         this.setState({
        //             confirmationMode: {
        //                 type: 'public-to-private',
        //                 isBulkShareProtected,
        //             },
        //         })
        //     } else {
        //         this.handleUnshare({ isBulkShareProtected })
        //     }
        // } else {
        //     return this.handleUnshare({ isBulkShareProtected })
        // }
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
            return selectType === 'select'
                ? selectEntry(listId)
                : unselectEntry(listId)
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

    privacyOptions = () => {
        return [
            {
                icon: 'personFine',
                title: 'Private',
                hasProtectedOption: true,
                onClick: this.handleSetPrivate,
                isSelected: !this.props.isShared,
                shortcut: `${SingleNoteShareMenu.MOD_KEY}+enter`,
                description: (
                    <>
                        Private to you <br /> unless shared in specific Spaces
                    </>
                ),
                getRootElement: this.props.getRootElement,
            },
            {
                icon: 'globe',
                title: 'Auto-Added',
                hasProtectedOption: true,
                onClick: this.handleSetShared,
                isSelected: this.props.isShared,
                shortcut: `shift+${SingleNoteShareMenu.MOD_KEY}+enter`,
                description: (
                    <>
                        For annotations relevant for many contexts Auto-shared
                        to Spaces <br /> the page is added to{' '}
                    </>
                ),
                getRootElement: this.props.getRootElement,
            },
        ]
    }

    render() {
        return (
            <>
                <>
                    {/* <ShareMenuContainer>
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
                            autoCreateLinkSetting={
                                this.state.autoCreateLinkSetting
                            }
                            autoCreateLinkState={this.state.autoCreateLinkState}
                            toggleAutoCreateLinkSetting={async () => {
                                await this.toggleAutoCreateLinkSetting()
                            }}
                            autoShareState={this.state.autoShareState}
                            handleCreateLink={this.handleCreateLink}
                            shortcutHandlerDict={{
                                // 'mod+shift+enter': this.handleSetProtected,
                                'mod+shift+enter': () =>
                                    this.handleSetShared(false),
                                'mod+enter': () => this.handleSetPrivate(false),
                                'alt+enter': () => this.handleSetPrivate(true),
                                'alt+shift+enter': () =>
                                    this.handleSetShared(true),
                            }}
                            getRootElement={this.props.getRootElement}
                        />
                    </ShareMenuContainer> */}
                    {/* <PrivacyContainer isLinkShown={this.props.showLink}>
                        <SubtitleSection>
                            <SectionTitle>Add to Spaces</SectionTitle>
                            <AutoAddContainer
                                onMouseEnter={() =>
                                    this.setState({ showAutoAddMenu: true })
                                }
                                onMouseLeave={() => {
                                    this.setState({ showAutoAddMenu: false })
                                }}
                                ref={this.autoAddButtonRef}
                            >
                                {this.renderAutoAddDefaultSettings}
                                <Checkbox
                                    key={13}
                                    id={'13'}
                                    isChecked={
                                        this.privacyOptions()[1].isSelected
                                    }
                                    handleChange={() => {
                                        this.privacyOptions()[1].isSelected
                                            ? this.privacyOptions()[0].onClick()
                                            : this.privacyOptions()[1].onClick()
                                    }}
                                    // isDisabled={!this.state.shortcutsEnabled}
                                    name={'Boost'}
                                    label={
                                        <LabelContainer>
                                            <Icon
                                                icon={'spread'}
                                                color={
                                                    this.privacyOptions()[1]
                                                        .isSelected
                                                        ? 'prime1'
                                                        : 'greyScale5'
                                                }
                                                hoverOff
                                                heightAndWidth="22px"
                                            />
                                            Auto Add
                                        </LabelContainer>
                                    }
                                    textPosition={'left'}
                                    fontSize={14}
                                    size={14}
                                    isLoading={
                                        this.state.autoShareState === 'running'
                                    }
                                />
                            </AutoAddContainer>
                        </SubtitleSection>
                    </PrivacyContainer> */}
                    <PrivacyOptionContainer>
                        {/* {this.privacyOptions().map((props, i) => (
                            <SharePrivacyOption key={i} {...props} />
                        ))} */}
                    </PrivacyOptionContainer>
                    <SpacepickerContainer>
                        <SpacePicker
                            {...this.props.spacePickerProps}
                            showPageLinks
                            selectEntry={this.handleSpacePickerSelection(
                                'select',
                            )}
                            unselectEntry={this.handleSpacePickerSelection(
                                'unselect',
                            )}
                            width={'300px'}
                            autoFocus={true}
                            getRootElement={this.props.getRootElement}
                        />
                    </SpacepickerContainer>
                </>
            </>
        )
    }
}

const AutoAddDefaultContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    grid-gap: 15px;
`

const ShareMenuContainer = styled.div`
    position: relative;
    z-index: 11;
`
const SpacepickerContainer = styled.div`
    position: relative;
    z-index: 10;
`

const TooltipTextBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 5px;
    justify-content: center;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 14px;
    text-align: center;
    grid-gap: 10px;
    padding: 15px 15px 8px 15px;
`

const DefaultCheckBoxContainer = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    height: 20px;
    padding: 15px 15px 15px 15px;
`
const KeyboardShortCutBox = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding: 15px 5px;
    align-items: center;
    height: 30px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    grid-gap: 15px;
`

const SubtitleSection = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 0 15px;
`

const AutoAddContainer = styled.div`
    display: flex;
    grid-gap: 2px;
    align-items: center;
    justify-content: flex-end;
    flex-direction: row;
`
const LabelContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-direction: row;
`

const TopArea = styled.div<{ context: string }>`
    padding: 10px 15px 10px 15px;
    height: fit-content;
    margin-bottom: 20px;
    grid-gap: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:first-child {
        padding: 0px 15px 0px 15px;
    }

    ${(props) =>
        props.context === 'AllNotesShare' &&
        css`
            height: fit-content;

            &:first-child {
                padding: unset;
                margin-bottom: 0px;
            }
        `};
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
    background-color: ${(props) => props.theme.colors.greyScale1}70;
    border-radius: 5px;
`

const LoadingBox = styled.div<{
    height?: string
    loaderPosition?: string
    padding?: string
}>`
    width: 100%;
    display: flex;
    height: ${(props) => props.height || '100%'};
    align-items: center;
    justify-content: ${(props) => props.loaderPosition || 'center'};
    padding: ${(props) => props.padding || 'unset'};
`

const PrivacyContainer = styled.div<{ isLinkShown: boolean }>`
    width: 100%;
`

const SectionTitle = styled.div`
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.white};
    white-space: nowrap;
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    color: ${(props) => props.theme.colors.greyScale4};
    white-space: nowrap;
    padding-left: 5px;
`

const PrivacyOptionContainer = styled(Margin)`
    display: flex;
    justify-content: space-between;
    width: fill-available;
    flex-direction: row;
    align-items: center;
    grid-gap: 4px;
`
