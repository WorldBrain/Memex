import React from 'react'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'

interface State {
    isShareAllChecked: boolean
}

export interface Props {
    noteId: string
    closeShareMenu: () => void
}

export default class SingleNoteShareModal extends React.PureComponent<
    Props,
    State
> {
    state: State = {
        isShareAllChecked: false,
    }

    private getCreatedLink = async () => {
        // TODO: Call BG method
        await delay(1000)

        return 'memex.social/l/this-is-not-real'
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
                shareAllText="Share Note in all collections this page is in"
            />
        )
    }
}
