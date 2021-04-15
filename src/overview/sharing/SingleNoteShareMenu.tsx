import React from 'react'
import { TaskState } from 'ui-logic-core/lib/types'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

interface State {
    shareState: TaskState
}

export interface Props {
    annotationUrl: string
    copyLink: (link: string) => Promise<void>
    closeShareMenu: React.MouseEventHandler
    postShareHook?: () => void
    postUnshareHook?: () => void
    annotationsBG?: AnnotationInterface<'caller'>
    contentSharingBG?: ContentSharingInterface
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
        shareState: 'pristine',
    }

    private shareAnnotation = async (): Promise<string> => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({ annotationUrl })
        await contentSharingBG.shareAnnotationsToLists({
            annotationUrls: [annotationUrl],
            queueInteraction: 'skip-queue',
        })
        this.props.postShareHook?.()
        return contentSharingBG.getRemoteAnnotationLink({ annotationUrl })
    }

    private unshareAnnotation = async () => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.unshareAnnotation({ annotationUrl })
        this.props.postUnshareHook?.()
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
                await this.unshareAnnotation()
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
                await this.unshareAnnotation()
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
                getLink={this.shareAnnotation}
                onCopyLinkClick={this.props.copyLink}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this note"
                privacyOptionsTitleCopy="Set privacy for this note"
                privacyOptionsLoading={this.state.shareState === 'running'}
                privacyOptions={[
                    {
                        title: 'Protected',
                        shortcut: 'shift+cmd+enter',
                        description: 'Private & never shared',
                        icon: icons.lock,
                        onClick: this.handleSetProtected,
                    },
                    {
                        title: 'Private',
                        shortcut: 'cmd+enter',
                        description: 'Private to you, until shared (in bulk)',
                        icon: icons.link,
                        onClick: this.handleSetPrivate,
                    },
                    {
                        title: 'Shared',
                        shortcut: 'option+cmd+enter',
                        description: 'Added to shared collections & page links',
                        icon: icons.shared,
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
