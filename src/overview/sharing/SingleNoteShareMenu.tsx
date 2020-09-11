import React from 'react'
import { TaskState } from 'ui-logic-core/lib/types'
import styled from 'styled-components'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { contentSharing } from 'src/util/remote-functions-background'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { LoadingIndicator } from 'src/common-ui/components'
import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'

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

export default class SingleNoteShareMenu extends React.PureComponent<
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
        await this.contentSharingBG.shareAnnotationsToLists({
            annotationUrls: [annotationUrl],
            queueInteraction: 'skip-queue',
        })
        this.props.postShareHook?.()
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
        if (this.state.unshareState === 'running') {
            return
        }

        this.setState({ unshareState: 'running' })
        await this.contentSharingBG.unshareAnnotation({
            annotationUrl: this.props.annotationUrl,
        })
        this.setState({ unshareState: 'success' })
        this.props.postUnshareHook?.()
        this.props.closeShareMenu()
    }

    render() {
        const { unshareState } = this.state
        return (
            <ShareAnnotationMenu
                // shareAllState={this.state.shareStatusState}
                getLink={this.getLink}
                onCopyLinkClick={this.handleLinkCopy}
                onClickOutside={this.props.closeShareMenu}
                // checkboxTitleCopy="Share Note"
                // checkboxCopy="Share Note in all collections this page is in"
            >
                {unshareState === 'error' ? (
                    'Error unsharing annotation...'
                ) : (
                    <SecondaryAction
                        label={
                            unshareState === 'running' ? (
                                <LoadingIndicator />
                            ) : (
                                'Unshare'
                            )
                        }
                        onClick={this.handleUnshare}
                    />
                )}
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
    margin: 10px 0px 0;

    & > span {
        text-align: center;
        font-size: 12px;
    }
`
