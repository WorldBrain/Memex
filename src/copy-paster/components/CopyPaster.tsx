import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { Template } from '../types'
import TemplateEditor from './TemplateEditor'
import TemplateList from './TemplateList'

const CopyPasterWrapper = styled.div`
    min-width: 270px;
    & * {
        font-family: 'Satoshi', sans-serif;
        font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
            'ss04' on, 'liga' off;
    }
`

interface CopyPasterProps {
    isLoading: boolean
    templates: Template[]
    copyPasterEditingTemplate?: Template
    isNew: boolean

    onClickNew: () => void
    onClickEdit: (id: number) => void
    onClick: (id: number) => void
    onClickCancel: () => void
    onClickSave: () => void
    onClickDelete: () => void
    onClickHowto: () => void

    onTitleChange: (title: string) => void
    onCodeChange: (code: string) => void
    onSetIsFavourite: (id: number, isFavourite: boolean) => void
    onOutputFormatChange: (format: string) => void

    onClickOutside?: React.MouseEventHandler
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

    render() {
        const { copyPasterEditingTemplate, templates } = this.props

        return (
            <CopyPasterWrapper>
                {copyPasterEditingTemplate ? (
                    <TemplateEditor
                        isNew={this.props.isNew}
                        template={copyPasterEditingTemplate}
                        onClickSave={() => this.props.onClickSave()}
                        onClickCancel={this.props.onClickCancel}
                        onClickDelete={() => this.props.onClickDelete()}
                        onClickHowto={this.props.onClickHowto}
                        onTitleChange={(s) => this.props.onTitleChange(s)}
                        onOutputFormatChange={(format) =>
                            this.props.onOutputFormatChange(format)
                        }
                        onCodeChange={(s) => this.props.onCodeChange(s)}
                    />
                ) : (
                    <TemplateList
                        templates={templates}
                        isLoading={this.props.isLoading}
                        onClickSetIsFavourite={this.props.onSetIsFavourite}
                        onClickEdit={(id) => this.props.onClickEdit(id)}
                        onClickHowto={this.props.onClickHowto}
                        onClickNew={this.props.onClickNew}
                        onClick={this.props.onClick}
                    />
                )}
            </CopyPasterWrapper>
        )
    }
}

export default CopyPaster
