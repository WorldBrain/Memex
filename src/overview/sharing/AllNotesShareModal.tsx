import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import { contentSharing } from 'src/util/remote-functions-background'
import { getPageShareUrl } from 'src/content-sharing/utils'

interface State {
    isShareAllChecked: boolean
}

export interface Props {
    pageUrl: string
    closeShareMenu: () => void
}

export default class AllNotesShareModal extends React.PureComponent<
    Props,
    State
> {
    state: State = {
        isShareAllChecked: false,
    }

    private getCreatedLink = async () => {
        const remotePageInfoId = await contentSharing.ensureRemotePageId(
            this.props.pageUrl,
        )
        return getPageShareUrl({ remotePageInfoId })
    }

    private getAllSharedStatus = async () => {
        // TODO: Call BG method
        await delay(1000)

        return this.state.isShareAllChecked
    }

    private handleSetAllShareStatus = async () => {
        // TODO: Call BG method
        await delay(1000)

        return this.setState((state) => ({
            isShareAllChecked: !state.isShareAllChecked,
        }))
    }

    private handleLinkCopy = (link: string) => {
        navigator.clipboard.writeText(link).catch((e) => {
            console.error(e)
        })
    }

    private handleUnshare = async () => {
        // TODO: Call BG method
        await delay(1000)

        this.props.closeShareMenu()
    }

    render() {
        return (
            <ShareAnnotationMenu
                onUnshareClick={this.handleUnshare}
                getCreatedLink={this.getCreatedLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                getAllSharedStatus={this.getAllSharedStatus}
                onShareAllClick={this.handleSetAllShareStatus}
                shareAllText="Share all Notes on this page"
            />
        )
    }
}
