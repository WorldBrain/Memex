import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import {
    annotations as annotationsBG,
    contentSharing,
} from 'src/util/remote-functions-background'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { getPageShareUrl } from 'src/content-sharing/utils'
import { TaskState } from 'ui-logic-core/lib/types'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { LoadingIndicator } from 'src/common-ui/components'

interface State {
    shareAllState: TaskState
    unshareAllState: TaskState
}

export interface Props {
    normalizedPageUrl: string
    closeShareMenu: () => void
    postShareAllHook?: () => void
    postUnshareAllHook?: () => void
}

export default class AllNotesShareModal extends React.Component<Props, State> {
    private contentSharingBG = contentSharing
    private annotationsBG = annotationsBG
    private annotationUrls: string[]

    state: State = {
        shareAllState: 'pristine',
        unshareAllState: 'pristine',
    }

    async componentDidMount() {
        const annotations = await this.annotationsBG.listAnnotationsByPageUrl({
            pageUrl: this.props.normalizedPageUrl,
        })
        this.annotationUrls = annotations.map((a) => a.url)

        // const shareAllBtn = await this.getAllSharedBtnState()

        // this.setState({ shareAllBtn })
    }

    private async getAllSharedBtnState(): Promise<'checked' | 'unchecked'> {
        const annotsMetadata = await this.contentSharingBG.getRemoteAnnotationMetadata(
            { annotationUrls: this.annotationUrls },
        )

        for (const url of this.annotationUrls) {
            if (!annotsMetadata[url]) {
                return 'unchecked'
            }
        }

        return 'checked'
    }

    private getCreatedLink = async () => {
        const remotePageInfoId = await this.contentSharingBG.ensureRemotePageId(
            this.props.normalizedPageUrl,
        )
        return getPageShareUrl({ remotePageInfoId })
    }

    private handleShareAll = async () => {
        await executeReactStateUITask<State, 'shareAllState'>(
            this,
            'shareAllState',
            async () => {
                await this.contentSharingBG.shareAnnotations({
                    annotationUrls: this.annotationUrls,
                    queueInteraction: 'skip-queue',
                })
                await this.contentSharingBG.shareAnnotationsToLists({
                    annotationUrls: this.annotationUrls,
                    queueInteraction: 'skip-queue',
                })
            },
        )
        this.props.postShareAllHook?.()

        // if (this.state.shareAllBtn === 'unchecked') {
        //     this.setState({ shareAllBtn: 'running' })
        //     await this.contentSharingBG.shareAnnotations({
        //         annotationUrls: this.annotationUrls,
        //     })
        //     this.props.postShareAllHook?.()
        //     this.setState({ shareAllBtn: 'checked' })
        // } else {
        //     this.setState({ shareAllBtn: 'running' })
        //     await delay(1000)
        //     this.props.postUnshareAllHook?.()
        //     this.setState({ shareAllBtn: 'unchecked' })
        // }
    }

    private handleUnshareAll = async () => {
        await executeReactStateUITask<State, 'unshareAllState'>(
            this,
            'unshareAllState',
            async () => {
                await Promise.all(
                    this.annotationUrls.map((annotationUrl) =>
                        this.contentSharingBG.unshareAnnotation({
                            annotationUrl,
                            queueInteraction: 'skip-queue',
                        }),
                    ),
                )
                // await this.contentSharingBG.unshareAnnotations({
                //     annotationUrls: this.annotationUrls,
                //     queueInteraction: 'skip-queue',
                // })
            },
        )
        this.props.postUnshareAllHook?.()
    }

    private handleLinkCopy = (link: string) =>
        navigator.clipboard.writeText(link)

    // TODO: implement in milestone 3.
    //   It should: "remove the link of that page, so it deletes the shared-page object and all the associated annotation entries"
    //
    // private handleUnshare = async () => {
    //     // TODO: Call BG method
    //     await delay(1000)

    //     this.props.closeShareMenu()
    // }

    shouldShowShareAll() {
        return (
            this.state.shareAllState === 'pristine' &&
            this.state.unshareAllState !== 'running'
        )
    }

    shouldShowUnshareAll() {
        return (
            this.state.unshareAllState === 'pristine' &&
            this.state.shareAllState !== 'running'
        )
    }

    render() {
        return (
            <ShareAnnotationMenu
                // shareAllState={this.state.shareAllBtn}
                // onUnshareAllClick={this.handleUnshareAll}
                // onShareAllClick={this.handleShareAll}
                getLink={this.getCreatedLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                // checkboxCopy="Share all Notes on this page"
                // checkboxTitleCopy="Share all Notes"
                // checkboxSubtitleCopy="Add all notes on page to shared collections"
                linkTitleCopy="Link to Page"
                linkSubtitleCopy="A link to all shared notes on this page"
            >
                {this.shouldShowShareAll() && (
                    <PrimaryAction
                        label="Share all notes"
                        onClick={this.handleShareAll}
                    />
                )}
                {this.shouldShowUnshareAll() && (
                    <SecondaryAction
                        label="Un-share all notes"
                        onClick={this.handleUnshareAll}
                    />
                )}
                {(this.state.shareAllState === 'running' ||
                    this.state.unshareAllState === 'running') && (
                    <LoadingIndicator />
                )}
            </ShareAnnotationMenu>
        )
    }
}
