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
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import { fonts } from 'src/dashboard-refactor/styles'

import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'

interface State {
    shareAllState: TaskState
    unshareAllState: TaskState
}

export interface Props {
    normalizedPageUrl: string
    closeShareMenu: React.MouseEventHandler
    copyLink: (link: string) => Promise<void>
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
                linkTitleCopy="Link to page and shared notes"
                linkSubtitleCopy=""
            >
                <PrivacyContainer>
                    <PrivacyTitle>
                        Set privacy for all notes on this page
                    </PrivacyTitle>
                    <PrivacyOptionContainer top="5px">
                        {this.state.shareAllState === 'running' ||
                        this.state.unshareAllState === 'running' ? (
                            <LoadingIndicator />
                        ) : (
                            <>
                                <PrivacyOptionItem
                                    onClick={this.handleUnshareAll}
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
                                    onClick={this.handleShareAll}
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

const SharedNoteInfo = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
    margin: 10px 0 0;
    line-height: 16px;

    & > span {
        text-align: center;
        font-size: 12px;
    }
`
