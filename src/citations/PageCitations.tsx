import React from 'react'
import CopyPaster, {
    Props as CopyPasterProps,
} from 'src/copy-paster/CopyPaster'
import type { Template } from 'src/copy-paster/types'
import PageLinkShareMenuContainer, {
    Props as PageLinkProps,
} from 'src/custom-lists/ui/page-link-share-menu'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import styled, { css } from 'styled-components'
import { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import ShareAnnotationMenu from 'src/overview/sharing/components/ShareAnnotationMenu'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { AnnotationSharingState } from 'src/content-sharing/background/types'
import { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'

export interface Props {
    copyPasterProps: Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'>
    pageLinkProps: PageLinkProps
    annotationShareProps?: {
        isForAnnotation?: boolean
        postShareHook?: (
            state: AnnotationSharingState,
            opts?: { keepListsIfUnsharing?: boolean },
        ) => void
        annotationsCache: PageAnnotationsCacheInterface
    }
    annotationUrls: string[]
    getRootElement: () => HTMLElement
    syncSettingsBG?: RemoteSyncSettingsInterface
}

interface State {
    optionSelected: 'CopyToClipboard' | 'ShareViaLink'
    linkLoadingState: TaskState
}

export default class PageCitations extends React.PureComponent<Props, State> {
    state: State = {
        optionSelected: 'CopyToClipboard',
        linkLoadingState: 'pristine',
    }

    private renderTemplate = (id: number) => {
        const { copyPasterProps, pageLinkProps, annotationUrls } = this.props
        const normalizedPageUrl = normalizeUrl(pageLinkProps.fullPageUrl)
        return copyPasterProps.copyPasterBG.renderTemplate({
            id,
            annotationUrls,
            normalizedPageUrls: [normalizedPageUrl],
        })
    }

    private renderPreview = async (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => {
        const { copyPasterProps, pageLinkProps, annotationUrls } = this.props
        const normalizedPageUrl = normalizeUrl(pageLinkProps.fullPageUrl)
        return copyPasterProps.copyPasterBG.renderPreview({
            templateType: templateType,
            template,
            annotationUrls,
            normalizedPageUrls: [normalizedPageUrl],
        })
    }

    switchOption = () => {
        this.setState((state) => ({
            optionSelected:
                state.optionSelected === 'CopyToClipboard'
                    ? 'ShareViaLink'
                    : 'CopyToClipboard',
        }))
    }
    setLoadingState = (loadingState) => {
        this.setState({ linkLoadingState: loadingState })
    }

    render() {
        return (
            <PageCitationContainer>
                <PageCitationTopBar>
                    <ButtonContainer>
                        <PrimaryAction
                            label={'Custom Copy/Paste'}
                            onClick={this.switchOption}
                            type={'menuBar'}
                            size={'small'}
                            active={
                                this.state.optionSelected === 'CopyToClipboard'
                            }
                            fontColor="greyScale6"
                            icon={'copy'}
                        />
                    </ButtonContainer>
                    <ButtonContainer>
                        <PrimaryAction
                            label={'Via Links'}
                            onClick={this.switchOption}
                            type={'menuBar'}
                            size={'small'}
                            active={
                                this.state.optionSelected === 'ShareViaLink'
                            }
                            fontColor="greyScale6"
                            icon={'link'}
                        />
                        {this.state.linkLoadingState === 'running' && (
                            <LoadingBox>
                                <TooltipBox
                                    tooltipText={
                                        <span>
                                            You can already copy & share the
                                            links but the data is still
                                            uploading
                                        </span>
                                    }
                                    placement="bottom"
                                    width="180px"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <LoadingIndicator size={14} />
                                </TooltipBox>
                            </LoadingBox>
                        )}
                    </ButtonContainer>
                </PageCitationTopBar>
                {this.state.optionSelected === 'CopyToClipboard' ? (
                    <CopyPaster
                        {...this.props.copyPasterProps}
                        renderPreview={this.renderPreview}
                        renderTemplate={this.renderTemplate}
                    />
                ) : this.props.annotationShareProps?.isForAnnotation ? (
                    <>
                        <ShareAnnotationMenu
                            getRootElement={this.props.getRootElement}
                            annotationUrl={this.props.annotationUrls[0]}
                            contentSharingBG={
                                this.props.pageLinkProps.contentSharingBG
                            }
                            syncSettingsBG={this.props.syncSettingsBG}
                            postShareHook={
                                this.props.annotationShareProps.postShareHook
                            }
                            annotationsCache={
                                this.props.annotationShareProps.annotationsCache
                            }
                        />
                    </>
                ) : (
                    <PageLinkShareMenuContainer
                        setLoadingState={this.setLoadingState}
                        {...this.props.pageLinkProps}
                    />
                )}
            </PageCitationContainer>
        )
    }
}

const PageCitationContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: space-between;
    grid-gap: 10px;
    flex-direction: column;
    width: 340px;

    * {
        font-family: 'Satoshi', sans-serif;
        font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
            'ss04' on;
    }
`

const PageCitationTopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-gap: 5px;
    padding: 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
`
const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: fill-available;
    width: -moz-available;
`

const LoadingBox = styled.div`
    position: absolute;
    right: 15px;
`
const TopArea = styled.div<{ context: string }>`
    padding: 10px 15px 10px 15px;
    height: fit-content;
    margin-bottom: 20px;
    grid-gap: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:first-child {
        padding: 0px 15px 0px 15px;
    }

    ${(props) =>
        props.context === 'AllNotesShare' &&
        css`
            height: fit-content;

            &:first-child {
                padding: unset;
                margin-bottom: 0px;
            }
        `};
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
    background-color: ${(props) => props.theme.colors.greyScale1}70;
    border-radius: 5px;
`
