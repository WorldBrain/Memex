import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import {
    annotations as annotationsBG,
    contentSharing,
} from 'src/util/remote-functions-background'
import { getPageShareUrl } from 'src/content-sharing/utils'

interface State {
    shareAllBtn: 'pristine' | 'running' | 'unchecked' | 'checked'
}

export interface Props {
    normalizedPageUrl: string
    closeShareMenu: () => void
}

export default class AllNotesShareModal extends React.PureComponent<
    Props,
    State
> {
    private contentSharingBG = contentSharing
    private annotationsBG = annotationsBG
    private annotationUrls: string[]

    state: State = {
        shareAllBtn: 'pristine',
    }

    async componentDidMount() {
        const annotations = await this.annotationsBG.listAnnotationsByPageUrl({
            pageUrl: this.props.normalizedPageUrl,
        })
        this.annotationUrls = annotations.map((a) => a.url)

        this.setState({ shareAllBtn: await this.getAllSharedBtnState() })
    }

    private async getAllSharedBtnState(): Promise<'checked' | 'unchecked'> {
        const annotsMetadata = await this.contentSharingBG.getRemoteAnnotationMetadata(
            { annotationUrls: this.annotationUrls },
        )

        for (const localId in annotsMetadata) {
            if (!annotsMetadata[localId]) {
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

    private handleSetAllShareStatus = async () => {
        if (this.state.shareAllBtn === 'unchecked') {
            this.setState({ shareAllBtn: 'running' })
            await this.contentSharingBG.shareAnnotations({
                annotationUrls: this.annotationUrls,
            })
            this.setState({ shareAllBtn: 'checked' })
        } else {
            this.setState({ shareAllBtn: 'running' })
            await delay(1000)
            this.setState({ shareAllBtn: 'unchecked' })
        }
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

    render() {
        return (
            <ShareAnnotationMenu
                shareAllBtn={this.state.shareAllBtn}
                // onUnshareClick={this.handleUnshare}
                getCreatedLink={this.getCreatedLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                onShareAllClick={this.handleSetAllShareStatus}
                shareAllText="Share all Notes on this page"
            />
        )
    }
}
