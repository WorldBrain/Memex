import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import { contentSharing } from 'src/util/remote-functions-background'
import { getPageShareUrl } from 'src/content-sharing/utils'

interface State {
    shareAllBtn: 'pristine' | 'running' | 'unchecked' | 'checked'
}

export interface Props {
    pageUrl: string
    closeShareMenu: () => void
}

export default class AllNotesShareModal extends React.PureComponent<
    Props,
    State
> {
    private contentSharingBG = contentSharing

    state: State = {
        shareAllBtn: 'pristine',
    }

    async componentDidMount() {
        // TODO: Get status of share all btn by looping through annot metadata for this page
    }

    private getCreatedLink = async () => {
        const remotePageInfoId = await this.contentSharingBG.ensureRemotePageId(
            this.props.pageUrl,
        )
        return getPageShareUrl({ remotePageInfoId })
    }

    private handleSetAllShareStatus = async () => {
        if (this.state.shareAllBtn === 'unchecked') {
            this.setState({ shareAllBtn: 'running' })
            await delay(1000)
            this.setState({ shareAllBtn: 'checked' })
        } else {
            this.setState({ shareAllBtn: 'running' })
            await delay(1000)
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
        return (
            <ShareAnnotationMenu
                shareAllBtn={this.state.shareAllBtn}
                onUnshareClick={this.handleUnshare}
                getCreatedLink={this.getCreatedLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                onShareAllClick={this.handleSetAllShareStatus}
                shareAllText="Share all Notes on this page"
            />
        )
    }
}
