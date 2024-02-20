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
import styled from 'styled-components'
import { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

export interface Props {
    copyPasterProps: Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'>
    pageLinkProps: PageLinkProps
    annotationUrls: string[]
    getRootElement: () => HTMLElement
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
