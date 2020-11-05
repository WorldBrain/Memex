import React from 'react'
import styled from 'styled-components'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
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

import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'

interface State {
    shareAllState: TaskState
    unshareAllState: TaskState
}

export interface Props {
    normalizedPageUrl: string
    copyLink: (link: string) => Promise<void>
    closeShareMenu: () => void
    postShareAllHook?: () => void
    postUnshareAllHook?: () => void
}

export default class AllNotesShareMenu extends React.Component<Props, State> {
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

    // TODO: implement in milestone 3.
    //   It should: "remove the link of that page, so it deletes the shared-page object and all the associated annotation entries"
    //
    // private handleUnshare = async () => {
    //     // TODO: Call BG method
    //     await delay(1000)

    //     this.props.closeShareMenu()
    // }

    render() {
        return (
            <ShareAnnotationMenu
                // shareAllState={this.state.shareAllBtn}
                // onUnshareAllClick={this.handleUnshareAll}
                // onShareAllClick={this.handleShareAll}
                getLink={this.getCreatedLink}
                onCopyLinkClick={this.props.copyLink}
                onClickOutside={this.props.closeShareMenu}
                // checkboxCopy="Share all Notes on this page"
                // checkboxTitleCopy="Share all Notes"
                // checkboxSubtitleCopy="Add all notes on page to shared collections"
                linkTitleCopy="Link to Notes"
                linkSubtitleCopy="A link to all shared notes on this page"
            >
                <PrimaryAction
                    label={
                        this.state.shareAllState === 'running' ? (
                            <LoadingIndicator />
                        ) : (
                            'Share all notes'
                        )
                    }
                    onClick={
                        this.state.shareAllState === 'running'
                            ? undefined
                            : this.handleShareAll
                    }
                />
                <Margin />
                <SecondaryAction
                    label={
                        this.state.unshareAllState === 'running' ? (
                            <LoadingIndicator />
                        ) : (
                            'Un-share all notes'
                        )
                    }
                    onClick={
                        this.state.unshareAllState === 'running'
                            ? undefined
                            : this.handleUnshareAll
                    }
                />
                <SharedNoteInfo>
                    <TypographyTextNormal>
                        {' '}
                        Shared notes are available via the page link and
                        collections <strong>the page is part of</strong>.
                    </TypographyTextNormal>
                </SharedNoteInfo>
            </ShareAnnotationMenu>
        )
    }
}

const SharedNoteInfo = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
    font-size: 1
    margin: 10px 0 0;

    & > span {
        text-align: center;
        font-size: 12px;
    }
`

const Margin = styled.div`
    height: 5px;
`
