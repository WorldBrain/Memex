import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { getPageShareUrl } from 'src/content-sharing/utils'
import type { ShareMenuCommonProps, ShareMenuCommonState } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

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
        const { annotationsBG, normalizedPageUrl } = this.props
        await executeReactStateUITask<State, 'loadState'>(
            this,
            'loadState',
            async () => {
                await this.setRemoteLink()

                const annotations = await annotationsBG.listAnnotationsByPageUrl(
                    { pageUrl: normalizedPageUrl },
                )
                this.annotationUrls = annotations.map((a) => a.url)
            },
        )
    }

    private handleLinkCopy = () => this.props.copyLink(this.state.link)

    private setRemoteLink = async () => {
        const remotePageInfoId = await this.props.contentSharingBG.ensureRemotePageId(
            this.props.normalizedPageUrl,
        )
        this.setState({ link: getPageShareUrl({ remotePageInfoId }) })
    }

    private shareAllAnnotations = async () => {
        try {
            const {
                sharingStates,
            } = await this.props.contentSharingBG.shareAnnotations({
                annotationUrls: this.annotationUrls,
                shareToLists: true,
            })
            this.props.postBulkShareHook?.(sharingStates)
        } catch (err) {}
    }

    private unshareAllAnnotations = async () => {
        try {
            const {
                sharingStates,
            } = await this.props.contentSharingBG.unshareAnnotations({
                annotationUrls: this.annotationUrls,
            })
            this.props.postBulkShareHook?.(sharingStates)
        } catch (err) {}
    }

    private handleSetShared = async () => {
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAllAnnotations()
            },
        )
    }

    private handleSetPrivate = async () => {
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAllAnnotations()
            },
        )
    }

    render() {
        return (
            <ShareAnnotationMenu
                showLink
                context={'AllNotesShare'}
                link={this.state.link}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to page and its public annotations"
                privacyOptionsTitleCopy="Set privacy for all annotations on this page"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        title: 'Public',
                        shortcut: `shift+${AllNotesShareMenu.MOD_KEY}+enter`,
                        description:
                            'Auto-added to Spaces the page is shared to',
                        icon: 'webLogo',
                        onClick: this.handleSetShared,
                    },
                    {
                        title: 'Private',
                        shortcut: `${AllNotesShareMenu.MOD_KEY}+enter`,
                        description: 'Private to you, until made public',
                        icon: 'person',
                        onClick: this.handleSetPrivate,
                    },
                ]}
                shortcutHandlerDict={{
                    'mod+shift+enter': this.handleSetShared,
                    'mod+enter': this.handleSetPrivate,
                }}
            />
        )
    }
}
