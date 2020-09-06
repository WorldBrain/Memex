import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import { contentSharing } from 'src/util/remote-functions-background'

interface State {
    readyToRender: boolean
    hasAnnotationBeenShared: boolean
    shareAllBtn: 'pristine' | 'running' | 'unchecked' | 'checked'
}

export interface Props {
    annotationUrl: string
    closeShareMenu: () => void
}

export default class SingleNoteShareModal extends React.PureComponent<
    Props,
    State
> {
    private contentSharingBG = contentSharing

    state: State = {
        readyToRender: false,
        hasAnnotationBeenShared: false,
        shareAllBtn: 'pristine',
    }

    async componentDidMount() {
        const metadataForAll = await this.contentSharingBG.getRemoteAnnotationMetadata(
            { annotationUrls: [this.props.annotationUrl] },
        )
        const metadata = metadataForAll[this.props.annotationUrl]

        this.setState({
            hasAnnotationBeenShared: !metadata,
            shareAllBtn: metadata?.excludeFromLists ? 'unchecked' : 'checked',
            readyToRender: true,
        })
    }

    private getCreatedLink = async () => {
        const { annotationUrl } = this.props

        if (!this.state.hasAnnotationBeenShared) {
            await this.contentSharingBG.shareAnnotation({ annotationUrl })
        }

        return this.contentSharingBG.getRemoteAnnotationLink({ annotationUrl })
    }

    private handleSetAllShareStatus = async () => {
        const annotationUrls = [this.props.annotationUrl]

        if (this.state.shareAllBtn === 'unchecked') {
            this.setState({ shareAllBtn: 'running' })
            await this.contentSharingBG.shareAnnotationsToLists({
                annotationUrls,
            })
            this.setState({ shareAllBtn: 'checked' })
        } else {
            this.setState({ shareAllBtn: 'running' })
            await this.contentSharingBG.unshareAnnotationsFromLists({
                annotationUrls,
            })
            this.setState({ shareAllBtn: 'unchecked' })
        }
    }

    private handleLinkCopy = (link: string) =>
        navigator.clipboard.writeText(link)

    private handleUnshare = async () => {
        // TODO: Call BG method
        await delay(1000)

        this.props.closeShareMenu()
    }

    render() {
        if (!this.state.readyToRender) {
            return null
        }

        return (
            <ShareAnnotationMenu
                shareAllBtn={this.state.shareAllBtn}
                onUnshareClick={this.handleUnshare}
                getCreatedLink={this.getCreatedLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                onShareAllClick={this.handleSetAllShareStatus}
                shareAllText="Share Note in all collections this page is in"
            />
        )
    }
}
