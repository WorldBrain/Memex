import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { getListShareUrl } from 'src/content-sharing/utils'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import { getKeyName } from 'src/util/os-specific-key-names'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'

interface State extends ShareMenuCommonState {
    showLink: boolean
}

export interface Props extends ShareMenuCommonProps {
    openListShareModal: () => void
    customListsBG?: RemoteCollectionsInterface
    shareImmediately: boolean
    listId: number
}

export default class ListShareMenu extends React.Component<Props, State> {
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

    private annotationUrls: string[]

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
    }

    async componentDidMount() {
        await executeReactStateUITask<State, 'loadState'>(
            this,
            'loadState',
            async () => {
                await this.setListUrlsForSharing()
                const linkExists = await this.setRemoteLinkIfExists()
                if (!linkExists && this.props.shareImmediately) {
                    this.shareList()
                }
            },
        )
    }

    private handlePlusBtnClick: React.MouseEventHandler = (e) => {
        this.props.openListShareModal()
    }

    private shareList = async () => {
        const { contentSharingBG, listId } = this.props

        const { remoteListId } = await contentSharingBG.shareList({ listId })
        await contentSharingBG.shareListEntries({ listId })

        this.setState({
            link: getListShareUrl({ remoteListId }),
            showLink: true,
        })
    }

    private setListUrlsForSharing = async () => {
        const { annotationsBG, customListsBG, listId } = this.props

        const listEntries = await customListsBG.fetchListPagesById({
            id: listId,
        })

        const pageUrlsSet = new Set(listEntries.map((entry) => entry.pageUrl))
        const annotationUrlsSet = new Set<string>()

        for (const pageUrl of pageUrlsSet) {
            const annotations = await annotationsBG.listAnnotationsByPageUrl({
                pageUrl,
            })
            annotations.forEach((a) => annotationUrlsSet.add(a.url))
        }

        this.annotationUrls = [...annotationUrlsSet]
    }

    private createAnnotationPrivacyLevels = (
        privacyLevel: AnnotationPrivacyLevels,
    ) =>
        this.annotationUrls.reduce(
            (acc, annotation) => ({
                ...acc,
                [annotation]: privacyLevel,
            }),
            {},
        )

    private handleLinkCopy = () => this.props.copyLink(this.state.link)

    private setRemoteLinkIfExists = async (): Promise<boolean> => {
        const { listId, contentSharingBG } = this.props
        const remoteListId = await contentSharingBG.getRemoteListId({
            localListId: listId,
        })
        if (!remoteListId) {
            return false
        }
        this.setState({
            link: getListShareUrl({ remoteListId }),
            showLink: true,
        })
        return true
    }

    private shareAllAnnotations = async () => {
        if (this.state.loadState !== 'success') {
            throw new Error('Share attempted before dependencies have loaded')
        }

        let success = false
        try {
            // Share list if it hasn't been shared already
            if (!this.state.showLink) {
                await this.shareList()
                await this.setRemoteLinkIfExists()
            }

            await this.props.contentSharingBG.shareAnnotations({
                annotationUrls: this.annotationUrls,
                queueInteraction: 'skip-queue',
            })
            await this.props.contentSharingBG.shareAnnotationsToLists({
                annotationUrls: this.annotationUrls,
                queueInteraction: 'skip-queue',
            })
            success = true
        } catch (err) {}

        this.props.postShareHook?.({
            privacyLevel: AnnotationPrivacyLevels.SHARED,
            shareStateChanged: success,
        })
    }

    private unshareAllAnnotations = async () => {
        let success = false
        try {
            await Promise.all(
                this.annotationUrls.map((annotationUrl) =>
                    this.props.contentSharingBG
                        .unshareAnnotation({
                            annotationUrl,
                            queueInteraction: 'skip-queue',
                        })
                        .catch((err) => {}),
                ),
            )
            success = true
        } catch (err) {}

        this.props.postUnshareHook?.({
            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            shareStateChanged: success,
        })
    }

    private handleSetShared: React.MouseEventHandler = async (e) => {
        const { annotationsBG } = this.props
        const annotationPrivacyLevels = this.createAnnotationPrivacyLevels(
            AnnotationPrivacyLevels.SHARED,
        )

        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAllAnnotations()
                await annotationsBG.updateAnnotationPrivacyLevels({
                    annotationPrivacyLevels,
                    respectProtected: true,
                })
            },
        )
    }

    private handleSetPrivate: React.MouseEventHandler = async (e) => {
        const { annotationsBG } = this.props
        const annotationPrivacyLevels = this.createAnnotationPrivacyLevels(
            AnnotationPrivacyLevels.PRIVATE,
        )

        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAllAnnotations()
                await annotationsBG.updateAnnotationPrivacyLevels({
                    annotationPrivacyLevels,
                    respectProtected: true,
                })
            },
        )
    }

    render() {
        return (
            <ShareAnnotationMenu
                link={this.state.link}
                showLink={this.state.showLink}
                onCopyLinkClick={this.handleLinkCopy}
                onPlusBtnClick={this.handlePlusBtnClick}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to collection and shared notes"
                privacyOptionsTitleCopy="Set privacy for all notes in this collection"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        title: 'Private',
                        shortcut: `${ListShareMenu.MOD_KEY}+enter`,
                        description: 'Only locally available to you',
                        icon: 'person',
                        onClick: this.handleSetPrivate,
                    },
                    {
                        title: 'Shared',
                        shortcut: `${ListShareMenu.ALT_KEY}+${ListShareMenu.MOD_KEY}+enter`,
                        description: 'Shared in collections this page is in',
                        icon: 'shared',
                        onClick: this.handleSetShared,
                    },
                ]}
                shortcutHandlerDict={{
                    'mod+alt+enter': this.handleSetShared,
                    'mod+enter': this.handleSetPrivate,
                }}
            />
        )
    }
}
