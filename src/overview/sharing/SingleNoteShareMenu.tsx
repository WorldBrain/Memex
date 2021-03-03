import React from 'react'
import { TaskState } from 'ui-logic-core/lib/types'
import styled from 'styled-components'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { contentSharing } from 'src/util/remote-functions-background'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { LoadingIndicator } from 'src/common-ui/components'
import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import { fonts } from 'src/dashboard-refactor/styles'

interface State {
    // readyToRender: boolean
    // hasAnnotationBeenShared?: boolean
    unshareState: TaskState
}

export interface Props {
    annotationUrl: string
    copyLink: (link: string) => Promise<void>
    closeShareMenu: React.MouseEventHandler
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

    private handleUnshare: React.MouseEventHandler = async (e) => {
        if (this.state.unshareState === 'running') {
            return
        }

        this.setState({ unshareState: 'running' })
        await this.contentSharingBG.unshareAnnotation({
            annotationUrl: this.props.annotationUrl,
        })
        this.setState({ unshareState: 'success' })
        this.props.postUnshareHook?.()
        this.props.closeShareMenu(e)
    }

    render() {
        const { unshareState } = this.state
        return (
            <ShareAnnotationMenu
                // shareAllState={this.state.shareStatusState}
                getLink={this.getLink}
                onCopyLinkClick={this.props.copyLink}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this note"
                // checkboxTitleCopy="Share Note"
                // checkboxCopy="Share Note in all collections this page is in"
            >
                <PrivacyContainer>
                    <PrivacyTitle>Set privacy for this note</PrivacyTitle>
                    <PrivacyOptionContainer top="5px">
                        {this.state.unshareState === 'running' ? (
                            <LoadingIndicator />
                        ) : (
                            <>
                                <PrivacyOptionItem
                                    onClick={this.handleUnshare}
                                    bottom="5px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.lock}
                                    />
                                    <PrivacyOptionBox>
                                        <PrivacyOptionTitle>
                                            Private
                                        </PrivacyOptionTitle>
                                        <PrivacyOptionSubTitle>
                                            Only locally available to you
                                        </PrivacyOptionSubTitle>
                                    </PrivacyOptionBox>
                                </PrivacyOptionItem>
                                <PrivacyOptionItem
                                    onClick={this.getLink}
                                    bottom="10px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.shared}
                                    />
                                    <PrivacyOptionBox>
                                        <PrivacyOptionTitle>
                                            Shared
                                        </PrivacyOptionTitle>
                                        <PrivacyOptionSubTitle>
                                            Shared in collections this page is
                                            in
                                        </PrivacyOptionSubTitle>
                                    </PrivacyOptionBox>
                                </PrivacyOptionItem>
                            </>
                        )}
                    </PrivacyOptionContainer>
                </PrivacyContainer>
            </ShareAnnotationMenu>
        )
    }
}

const PrivacyContainer = styled.div`
    width: 100%;

    & * {
        color: ${(props) => props.theme.colors.primary};
    }
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: bold;
    padding: 0px 15px;
`

const PrivacyOptionContainer = styled(Margin)`
    min-height: 100px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`

const PrivacyOptionItem = styled(Margin)`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
    cursor: pointer;
    padding: 2px 20px;
    width: fill-available;

    &:hover {
        background-color: ${colors.onHover};
    }
`

const PrivacyOptionBox = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    padding-left: 10px;
`

const PrivacyOptionTitle = styled.div`
    font-size: 13px;
    font-weight: bold;
    height: 16px;
`

const PrivacyOptionSubTitle = styled.div`
    font-size: 12px;
`
