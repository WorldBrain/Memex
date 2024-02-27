import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { TaskState } from 'ui-logic-core/lib/types'

import { executeReactStateUITask } from 'src/util/ui-logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Checkbox from 'src/common-ui/components/Checkbox'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import {
    AnnotationSharingState,
    ContentSharingInterface,
} from 'src/content-sharing/background/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { shareOptsToPrivacyLvl } from 'src/annotations/utils'
import { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'

const COPY_TIMEOUT = 2000

export interface ShorcutHandlerDict {
    [shortcut: string]: () => Promise<void>
}

export interface Props {
    getRootElement: () => HTMLElement
    annotationUrl: string
    contentSharingBG: ContentSharingInterface
    syncSettingsBG?: RemoteSyncSettingsInterface
    annotationsCache: PageAnnotationsCacheInterface
    postShareHook?: (
        state: AnnotationSharingState,
        opts?: { keepListsIfUnsharing?: boolean },
    ) => void
}

interface State {
    copyState: TaskState
    shareState: TaskState
    autoCreateLinkSetting: boolean | null
    autoCreateLinkState: TaskState
    link: string
    linkLoadState: TaskState
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    private syncSettings: SyncSettingsStore<'extension'>

    copyTimeout?: ReturnType<typeof setTimeout>
    menuRef: React.RefObject<HTMLDivElement>
    state: State = {
        copyState: 'pristine',
        shareState: 'pristine',
        autoCreateLinkSetting: null,
        autoCreateLinkState: 'pristine',
        link: null,
        linkLoadState: 'pristine',
    }
    async componentDidMount() {
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.props.syncSettingsBG,
        })

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

        if (!linkExists) {
            await this.shareAnnotation()
            await executeReactStateUITask<State, 'linkLoadState'>(
                this,
                'linkLoadState',
                async () => {
                    await this.shareAnnotation()
                },
            )
        } else {
            this.setState({ linkLoadState: 'success' })
        }
    }

    private shareAnnotation = async (isBulkShareProtected?: boolean) => {
        this.setState({ linkLoadState: 'running' })
        const { annotationUrl, contentSharingBG, annotationsCache } = this.props

        const currentSharingLevel = await contentSharingBG.getAnnotationSharingState(
            {
                annotationUrl,
            },
        )

        let sharingState = await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToParentPageLists: currentSharingLevel?.privacyLevel === 200,
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

        this.setState({ link })
        this.setState({ linkLoadState: 'success' })

        this.props.postShareHook?.(sharingState)
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }
    private setRemoteLinkIfExists = async (): Promise<boolean> => {
        const { annotationUrl, contentSharingBG } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })

        if (!link) {
            return false
        }
        this.setState({ link })
        this.setState({ linkLoadState: 'success' })
        return true
    }

    private createAnnotationLink = async (isBulkShareProtected?: boolean) => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({
            annotationUrl,
            shareToParentPageLists: false,
            skipPrivacyLevelUpdate: true,
        })

        // const sharingState = await contentSharingBG.setAnnotationPrivacyLevel({
        //     annotationUrl,
        //     privacyLevel: shareOptsToPrivacyLvl({
        //         shouldShare: false,
        //         isBulkShareProtected,
        //     }),
        // })
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })

        // await this.props.copyLink(link)

        // this.props.postShareHook?.(sharingState)
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

        // if (this.props.analyticsBG) {
        //     try {
        //         await trackSharedAnnotation(this.props.analyticsBG, {
        //             type: 'single',
        //         })
        //     } catch (error) {
        //         console.error(
        //             `Error tracking single annotation link share event', ${error}`,
        //         )
        //     }
        // }

        // this.setState({
        //     shareState: 'success',
        // })
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

    private handleLinkCopy = async () => {
        await copyToClipboard(this.state.link)
        this.setState({ copyState: 'success' })
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private handleCreateLinkClick = async () => {
        await executeReactStateUITask<State, 'copyState'>(
            this,
            'copyState',
            () => this.handleCreateLink(),
        )
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private renderLinkContent() {
        const { copyState } = this.state
        return (
            <TooltipBox
                tooltipText={
                    'Create a link to just this annotation for quick sharing'
                }
                placement="bottom"
                fullWidthTarget
                getPortalRoot={this.props.getRootElement}
            >
                <PrimaryAction
                    onClick={() =>
                        this.state.link
                            ? this.handleLinkCopy()
                            : this.handleCreateLinkClick()
                    }
                    label={
                        copyState === 'running' ||
                        this.state.linkLoadState === 'running' ? (
                            <LoadingIndicator size={14} />
                        ) : copyState === 'success' ? (
                            'Copied'
                        ) : (
                            'Copy Sharing Link'
                        )
                    }
                    icon={
                        copyState === 'running'
                            ? null
                            : copyState === 'success'
                            ? 'copy'
                            : 'link'
                    }
                    type="forth"
                    size="medium"
                    fullWidth
                />
            </TooltipBox>
        )
    }

    private renderMain() {
        return (
            <Menu ref={this.menuRef}>
                {this.state.link != null &&
                    this.state.linkLoadState === 'success' && (
                        <TopArea>
                            <LinkCopierBox>
                                {this.renderLinkContent()}
                            </LinkCopierBox>
                            <Checkbox
                                key={23}
                                id={'23'}
                                isChecked={
                                    this.state.autoCreateLinkSetting === true
                                }
                                handleChange={() =>
                                    this.toggleAutoCreateLinkSetting()
                                }
                                name={'Copy link when creating highlight'}
                                label={'Copy link when creating highlight'}
                                fontSize={14}
                                width="fit-content"
                                size={16}
                                isLoading={
                                    this.state.autoCreateLinkState === 'running'
                                }
                            />
                        </TopArea>
                    )}
                {this.state.linkLoadState === 'running' && (
                    <TopArea>
                        <LoadingIndicator size={18} />
                    </TopArea>
                )}
            </Menu>
        )
    }

    render() {
        if (this.menuRef) {
            this.menuRef.current.focus()
        }

        return this.renderMain()
    }
}

export default ShareAnnotationMenu

const Menu = styled.div`
    z-index: 10;
    position: relative;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
    &:first-child {
        padding: 15px 0px 0px 0px;
    }
`

const TopArea = styled.div`
    padding: 0 10px 15px 10px;
    height: fit-content;
    grid-gap: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
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
