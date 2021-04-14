import React from 'react'
import styled from 'styled-components'
import Mousetrap from 'mousetrap'

import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { getPageShareUrl } from 'src/content-sharing/utils'
import { TaskState } from 'ui-logic-core/lib/types'
import { LoadingIndicator } from 'src/common-ui/components'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'

import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

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
    contentSharingBG?: ContentSharingInterface
    annotationsBG?: AnnotationInterface<'caller'>
}

export default class AllNotesShareMenu extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    private annotationUrls: string[]

    private getShortcutHandlerDict = () => ({
        'mod+alt+enter': this.handleSetShared,
        'mod+enter': this.handleSetPrivate,
    })

    state: State = {
        shareAllState: 'pristine',
        unshareAllState: 'pristine',
    }

    async componentDidMount() {
        const annotations = await this.props.annotationsBG.listAnnotationsByPageUrl(
            {
                pageUrl: this.props.normalizedPageUrl,
            },
        )
        this.annotationUrls = annotations.map((a) => a.url)

        for (const [shortcut, handler] of Object.entries(
            this.getShortcutHandlerDict(),
        )) {
            Mousetrap.bind(shortcut, handler)
        }
    }

    componentWillUnmount() {
        for (const shortcut of Object.keys(this.getShortcutHandlerDict())) {
            Mousetrap.unbind(shortcut)
        }
    }

    private forAllAnnotations = (
        fn: (annotationUrl: string) => Promise<void>,
    ) => Promise.all(this.annotationUrls.map(fn))

    private getCreatedLink = async () => {
        const remotePageInfoId = await this.props.contentSharingBG.ensureRemotePageId(
            this.props.normalizedPageUrl,
        )
        return getPageShareUrl({ remotePageInfoId })
    }

    private shareAllAnnotations = async () => {
        await this.props.contentSharingBG.shareAnnotations({
            annotationUrls: this.annotationUrls,
            queueInteraction: 'skip-queue',
        })
        await this.props.contentSharingBG.shareAnnotationsToLists({
            annotationUrls: this.annotationUrls,
            queueInteraction: 'skip-queue',
        })
        this.props.postShareAllHook?.()
    }

    private unshareAllAnnotations = async () => {
        await this.forAllAnnotations((annotationUrl) =>
            this.props.contentSharingBG.unshareAnnotation({
                annotationUrl,
                queueInteraction: 'skip-queue',
            }),
        )
        this.props.postUnshareAllHook?.()
    }

    private handleSetShared: React.MouseEventHandler = async (e) => {
        const { annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareAllState'>(
            this,
            'shareAllState',
            async () => {
                await this.shareAllAnnotations()
                await this.forAllAnnotations((annotation) =>
                    annotationsBG.updateAnnotationPrivacyLevel({
                        annotation,
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )
            },
        )
    }

    private handleSetPrivate: React.MouseEventHandler = async (e) => {
        const { annotationsBG } = this.props
        await executeReactStateUITask<State, 'unshareAllState'>(
            this,
            'unshareAllState',
            async () => {
                await this.unshareAllAnnotations()
                await this.forAllAnnotations((annotation) =>
                    annotationsBG.updateAnnotationPrivacyLevel({
                        annotation,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    }),
                )
            },
        )
    }

    render() {
        return (
            <ShareAnnotationMenu
                getLink={this.getCreatedLink}
                onCopyLinkClick={this.props.copyLink}
                onClickOutside={this.props.closeShareMenu}
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
                                    onClick={this.handleSetPrivate}
                                    bottom="5px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.lock}
                                    />
                                    <PrivacyOptionBox>
                                        <PrivacyOptionTitleBox>
                                            <PrivacyOptionTitle>
                                                Private
                                            </PrivacyOptionTitle>
                                            <PrivacyOptionShortcut>
                                                cmd+enter
                                            </PrivacyOptionShortcut>
                                        </PrivacyOptionTitleBox>
                                        <PrivacyOptionSubTitle>
                                            Only locally available to you
                                        </PrivacyOptionSubTitle>
                                    </PrivacyOptionBox>
                                </PrivacyOptionItem>
                                <PrivacyOptionItem
                                    onClick={this.handleSetShared}
                                    bottom="10px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.shared}
                                    />
                                    <PrivacyOptionBox>
                                        <PrivacyOptionTitleBox>
                                            <PrivacyOptionTitle>
                                                Shared
                                            </PrivacyOptionTitle>
                                            <PrivacyOptionShortcut>
                                                option+cmd+enter
                                            </PrivacyOptionShortcut>
                                        </PrivacyOptionTitleBox>

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

const PrivacyOptionTitleBox = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: row;
    height: 16px;
`

const PrivacyOptionTitle = styled.div`
    font-size: 13px;
    font-weight: bold;
`

const PrivacyOptionShortcut = styled.div`
    font-size: 9px;
    font-weight: bold;
    padding-left: 5px;
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
