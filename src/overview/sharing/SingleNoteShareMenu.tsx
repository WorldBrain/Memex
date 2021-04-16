import React from 'react'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { ShareMenuCommonProps, ShareMenuCommonState } from './types'

interface State extends ShareMenuCommonState {
    showLink: boolean
}

export interface Props extends ShareMenuCommonProps {
    shareImmediately: boolean
    annotationUrl: string
}

export default class SingleNoteShareMenu extends React.PureComponent<
    Props,
    State
> {
    static defaultProps: Partial<Props> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    state: State = {
        link: '',
        showLink: false,
        loadState: 'pristine',
        shareState: 'pristine',
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
        const { annotationUrl, contentSharingBG } = this.props
        const link = await contentSharingBG.getRemoteAnnotationLink({
            annotationUrl,
        })
        if (!link) {
            return false
        }
        this.setState({ link, showLink: true })
        return true
    }

    private shareAnnotation = async () => {
        const { annotationUrl, contentSharingBG } = this.props

        let success = false
        try {
            await contentSharingBG.shareAnnotation({ annotationUrl })
            await contentSharingBG.shareAnnotationsToLists({
                annotationUrls: [annotationUrl],
                queueInteraction: 'skip-queue',
            })
            await this.setRemoteLinkIfExists()
            success = true
        } catch (err) {}
        this.props.postShareHook?.({
            privacyLevel: AnnotationPrivacyLevels.SHARED,
            shareStateChanged: success,
        })
    }

    private unshareAnnotation = async (
        privacyLevel: AnnotationPrivacyLevels,
    ) => {
        const { annotationUrl, contentSharingBG } = this.props

        let success = false
        try {
            await contentSharingBG.unshareAnnotation({ annotationUrl })
            this.setState({ showLink: false })
            success = true
        } catch (err) {}

        this.props.postUnshareHook?.({
            privacyLevel,
            shareStateChanged: success,
        })
    }

    private handleSetShared: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAnnotation()
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotation: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })
            },
        )
    }

    private handleSetProtected: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation(AnnotationPrivacyLevels.PROTECTED)
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotation: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                })
            },
        )
    }

    private handleSetPrivate: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation(AnnotationPrivacyLevels.PRIVATE)
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotation: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
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
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this note"
                privacyOptionsTitleCopy="Set privacy for this note"
                isLoading={
                    this.state.shareState === 'running' ||
                    this.state.loadState === 'running'
                }
                privacyOptions={[
                    {
                        title: 'Protected',
                        shortcut: 'shift+cmd+enter',
                        description: 'Private & never shared',
                        icon: 'lock',
                        onClick: this.handleSetProtected,
                    },
                    {
                        title: 'Private',
                        shortcut: 'cmd+enter',
                        description: 'Private to you, until shared (in bulk)',
                        icon: 'person',
                        onClick: this.handleSetPrivate,
                    },
                    {
                        title: 'Shared',
                        shortcut: 'option+cmd+enter',
                        description: 'Added to shared collections & page links',
                        icon: 'shared',
                        onClick: this.handleSetShared,
                    },
                ]}
                shortcutHandlerDict={{
                    'mod+shift+enter': this.handleSetProtected,
                    'mod+alt+enter': this.handleSetShared,
                    'mod+enter': this.handleSetPrivate,
                }}
            />
        )
    }
}
