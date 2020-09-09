import React from 'react'
import { TaskState } from 'ui-logic-core/lib/types'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import delay from 'src/util/delay'
import { contentSharing } from 'src/util/remote-functions-background'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { LoadingIndicator } from 'src/common-ui/components'

interface State {
    // readyToRender: boolean
    // hasAnnotationBeenShared?: boolean
    unshareState: TaskState
}

export interface Props {
    annotationUrl: string
    closeShareMenu: () => void
    postShareHook?: () => void
    postUnshareHook?: () => void
}

export default class SingleNoteShareModal extends React.PureComponent<
    Props,
    State
> {
    private contentSharingBG = contentSharing

    state: State = {
        // readyToRender: false,
        unshareState: 'pristine',
    }

    // async componentDidMount() {
    // const metadataForAll = await this.contentSharingBG.getRemoteAnnotationMetadata(
    //     { annotationUrls: [this.props.annotationUrl] },
    // )
    // const metadata = metadataForAll[this.props.annotationUrl]

    // this.setState({
    // hasAnnotationBeenShared: !!metadata,
    // isSharedToLists: metadata?.excludeFromLists,
    // readyToRender: true,
    // })
    // }

    private getLink = async () => {
        const { annotationUrl } = this.props
        await this.contentSharingBG.shareAnnotation({ annotationUrl })
        return this.contentSharingBG.getRemoteAnnotationLink({ annotationUrl })
    }

    // private handleSetAllShareStatus = async () => {
    // const annotationUrls = [this.props.annotationUrl]

    // if (this.state.shareStatusState === 'unchecked') {
    //     this.setState({ shareStatusState: 'running' })
    //     await this.contentSharingBG.shareAnnotationsToLists({
    //         annotationUrls,
    //     })
    //     this.props.postShareHook?.()
    //     this.setState({ shareStatusState: 'checked' })
    // } else {
    //     this.setState({ shareStatusState: 'running' })
    //     await this.contentSharingBG.unshareAnnotationsFromLists({
    //         annotationUrls,
    //     })
    //     this.props.postUnshareHook?.()
    //     this.setState({ shareStatusState: 'unchecked' })
    // }
    // }

    private handleLinkCopy = (link: string) =>
        navigator.clipboard.writeText(link)

    private handleUnshare = async () => {
        await this.contentSharingBG.unshareAnnotation({
            annotationUrl: this.props.annotationUrl,
        })
        this.props.closeShareMenu()
    }

    render() {
        return (
            <ShareAnnotationMenu
                // shareAllState={this.state.shareStatusState}
                getLink={this.getLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                // checkboxTitleCopy="Share Note"
                // checkboxCopy="Share Note in all collections this page is in"
            >
                {this.state.unshareState === 'pristine' && (
                    <SecondaryAction
                        label="Unshare"
                        onClick={this.handleUnshare}
                    />
                )}
                {this.state.unshareState === 'running' && <LoadingIndicator />}
                {this.state.unshareState === 'error' &&
                    'Error unsharing annotation...'}
            </ShareAnnotationMenu>
        )
    }
}
