import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { Template } from '../types'
import TemplateEditor from './TemplateEditor'
import TemplateList from './TemplateList'
import { OverlayModals } from '@worldbrain/memex-common/lib/common-ui/components/overlay-modals'
import { TaskState } from 'ui-logic-core/lib/types'

const CopyPasterWrapper = styled.div`
    min-width: 340px;
    & * {
        font-family: 'Satoshi', sans-serif;
        font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
            'ss04' on, 'liga' off;
    }
`

interface CopyPasterProps {
    isLoading: boolean
    copySuccess: boolean
    templateType: 'originalPage' | 'examplePage'
    templates: Template[]
    copyPasterEditingTemplate?: Template
    isNew: boolean
    isPreviewLoading: TaskState

    onClickNew: () => void
    onClickEdit: (id: number) => void
    onClickCopy: (id: number) => void
    onClickCancel: () => void
    onClickSave: () => void
    onClickDelete: () => void
    onClickHowto: () => void
    previewString: string

    onTitleChange: (title: string) => void
    onCodeChange: (code: string) => void
    onOutputFormatChange: (format: Template['outputFormat']) => void

    changeTemplateType: (templateType: string) => void
    getRootElement: () => HTMLElement
    onClickOutside?: React.MouseEventHandler
    onReorder: (id: number, oldIndex: number, newIndex: number) => void
    previewErrorMessage?: string | JSX.Element
    copyExistingRenderedToClipboard: (
        renderedText: string,
        templateId: number,
    ) => Promise<void>
    errorCopyToClipboard: boolean
    renderedTextBuffered: string
}

class CopyPaster extends PureComponent<CopyPasterProps> {
    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.isLoading) {
            null
        }
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    state = {
        focusIndex: 0,
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.copyPasterEditingTemplate &&
            !this.props.copyPasterEditingTemplate
        ) {
            document.addEventListener('keydown', this.handleKeyDown)
        } else if (
            !prevProps.copyPasterEditingTemplate &&
            this.props.copyPasterEditingTemplate
        ) {
            document.removeEventListener('keydown', this.handleKeyDown)
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown = (event) => {
        const { templates } = this.props
        const { focusIndex } = this.state
        if (event.key === 'ArrowUp') {
            this.setState({
                focusIndex: Math.max(0, focusIndex - 1),
            })
        } else if (event.key === 'ArrowDown') {
            this.setState({
                focusIndex: Math.min(templates.length - 1, focusIndex + 1),
            })
        }
        if (event.key === 'Enter') {
            this.props.onClickCopy(templates[focusIndex].id)
        }
        if (event.key === 'Escape') {
            this.handleClickOutside(event)
        }
    }

    render() {
        const { copyPasterEditingTemplate, templates } = this.props
        return (
            <CopyPasterWrapper>
                {copyPasterEditingTemplate ? (
                    <OverlayModals
                        positioning="centerCenter"
                        getPortalRoot={this.props.getRootElement}
                        blockedBackground
                    >
                        <TemplateEditor
                            isNew={this.props.isNew}
                            template={copyPasterEditingTemplate}
                            templateType={this.props.templateType}
                            isPreviewLoading={this.props.isPreviewLoading}
                            onClickSave={() => this.props.onClickSave()}
                            onClickCancel={this.props.onClickCancel}
                            onClickDelete={() => this.props.onClickDelete()}
                            onClickHowto={this.props.onClickHowto}
                            onTitleChange={(s) => this.props.onTitleChange(s)}
                            onOutputFormatChange={(format) =>
                                this.props.onOutputFormatChange(format)
                            }
                            onCodeChange={(s) => this.props.onCodeChange(s)}
                            previewString={this.props.previewString}
                            getRootElement={this.props.getRootElement}
                            changeTemplateType={this.props.changeTemplateType}
                            previewErrorMessage={this.props.previewErrorMessage}
                        />
                    </OverlayModals>
                ) : (
                    <TemplateList
                        templates={templates}
                        isLoading={this.props.isLoading}
                        copySuccess={this.props.copySuccess}
                        onClickEdit={(id) => this.props.onClickEdit(id)}
                        onClickHowto={this.props.onClickHowto}
                        onClickNew={this.props.onClickNew}
                        onClickCopy={this.props.onClickCopy}
                        getRootElement={this.props.getRootElement}
                        onReorder={this.props.onReorder}
                        focusIndex={this.state.focusIndex}
                        focusOnElement={(index) =>
                            this.setState({ focusIndex: index })
                        }
                        renderedTextBuffered={this.props.renderedTextBuffered}
                        copyExistingRenderedToClipboard={
                            this.props.copyExistingRenderedToClipboard
                        }
                        errorCopyToClipboard={this.props.errorCopyToClipboard}
                    />
                )}
            </CopyPasterWrapper>
        )
    }
}

export default CopyPaster
