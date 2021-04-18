import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { getPageShareUrl } from 'src/content-sharing/utils'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import { getKeyName } from 'src/util/os-specific-key-names'

interface State extends ShareMenuCommonState {}

export interface Props extends ShareMenuCommonProps {
    normalizedPageUrl: string
}

export default class AllNotesShareMenu extends React.Component<Props, State> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })
    static defaultProps: Partial<Props> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    private annotationUrls: string[]

    state: State = {
        link: '',
        loadState: 'pristine',
        shareState: 'pristine',
    }

    async componentDidMount() {
        await executeReactStateUITask<State, 'loadState'>(
            this,
            'loadState',
            async () => {
                await this.setRemoteLink()

                const annotations = await this.props.annotationsBG.listAnnotationsByPageUrl(
                    {
                        pageUrl: this.props.normalizedPageUrl,
                    },
                )
                this.annotationUrls = annotations.map((a) => a.url)
            },
        )
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

    private setRemoteLink = async () => {
        const remotePageInfoId = await this.props.contentSharingBG.ensureRemotePageId(
            this.props.normalizedPageUrl,
        )
        this.setState({ link: getPageShareUrl({ remotePageInfoId }) })
    }

    private shareAllAnnotations = async () => {
        let success = false
        try {
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
                showLink
                link={this.state.link}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to page and shared notes"
                privacyOptionsTitleCopy="Set privacy for all notes on this page"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        title: 'Private',
                        shortcut: `${AllNotesShareMenu.MOD_KEY}+enter`,
                        description: 'Only locally available to you',
                        icon: 'person',
                        onClick: this.handleSetPrivate,
                    },
                    {
                        title: 'Shared',
                        shortcut: `${AllNotesShareMenu.ALT_KEY}+${AllNotesShareMenu.MOD_KEY}+enter`,
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
