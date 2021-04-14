import React from 'react'
import { TaskState } from 'ui-logic-core/lib/types'
import styled from 'styled-components'

import { executeReactStateUITask } from 'src/util/ui-logic'
import ShareAnnotationMenu from './components/ShareAnnotationMenu'
import { LoadingIndicator } from 'src/common-ui/components'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

interface State {
    shareState: TaskState
}

export interface Props {
    annotationUrl: string
    copyLink: (link: string) => Promise<void>
    closeShareMenu: React.MouseEventHandler
    postShareHook?: () => void
    postUnshareHook?: () => void
    annotationsBG?: AnnotationInterface<'caller'>
    contentSharingBG?: ContentSharingInterface
}

export default class SingleNoteShareMenu extends React.PureComponent<
    Props,
    State
> {
    static defaultProps: Partial<Props> = {
        contentSharingBG: runInBackground(),
        annotationsBG: runInBackground(),
    }

    state: State = {
        shareState: 'pristine',
    }

    private shareAnnotation = async (): Promise<string> => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.shareAnnotation({ annotationUrl })
        await contentSharingBG.shareAnnotationsToLists({
            annotationUrls: [annotationUrl],
            queueInteraction: 'skip-queue',
        })
        this.props.postShareHook?.()
        return contentSharingBG.getRemoteAnnotationLink({ annotationUrl })
    }

    private unshareAnnotation = async () => {
        const { annotationUrl, contentSharingBG } = this.props
        await contentSharingBG.unshareAnnotation({ annotationUrl })
        this.props.postUnshareHook?.()
    }

    private handleSetShared: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.shareAnnotation()
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotationId: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })
            },
        )
    }

    private handleSetProtected: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation()
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotationId: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                })
            },
        )
    }

    private handleSetPrivate: React.MouseEventHandler = async (e) => {
        const { annotationUrl, annotationsBG } = this.props
        await executeReactStateUITask<State, 'shareState'>(
            this,
            'shareState',
            async () => {
                await this.unshareAnnotation()
                await annotationsBG.updateAnnotationPrivacyLevel({
                    annotationId: annotationUrl,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                })
            },
        )
    }

    render() {
        return (
            <ShareAnnotationMenu
                getLink={this.shareAnnotation}
                onCopyLinkClick={this.props.copyLink}
                onClickOutside={this.props.closeShareMenu}
                linkTitleCopy="Link to this note"
            >
                <PrivacyContainer>
                    <PrivacyTitle>Set privacy for this note</PrivacyTitle>
                    <PrivacyOptionContainer top="5px">
                        {this.state.shareState === 'running' ? (
                            <LoadingIndicator />
                        ) : (
                            <>
                                <PrivacyOptionItem
                                    onClick={this.handleSetProtected}
                                    bottom="5px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.lock}
                                    />
                                    <PrivacyOptionBox>
                                        <PrivacyOptionTitleBox>
                                            <PrivacyOptionTitle>
                                                Protected
                                            </PrivacyOptionTitle>
                                            <PrivacyOptionShortcut>
                                                shift+cmd+enter
                                            </PrivacyOptionShortcut>
                                        </PrivacyOptionTitleBox>
                                        <PrivacyOptionSubTitle>
                                            Private & never shared
                                        </PrivacyOptionSubTitle>
                                    </PrivacyOptionBox>
                                </PrivacyOptionItem>
                                <PrivacyOptionItem
                                    onClick={this.handleSetPrivate}
                                    bottom="10px"
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        path={icons.link}
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
                                            Private to you, until shared (in
                                            bulk)
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
                                            Added to shared collections & page
                                            links
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
