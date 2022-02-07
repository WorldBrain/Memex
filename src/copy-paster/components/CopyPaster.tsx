import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { Template } from '../types'
import TemplateEditor from './TemplateEditor'
import TemplateList from './TemplateList'
import { ClickAway } from 'src/util/click-away-wrapper'
import { isLoading } from 'src/overview/results/selectors'

const CopyPasterWrapper = styled.div`
    & * {
        font-family: 'Inter', sans-serif;
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
            <ClickAway onClickAway={this.handleClickOutside}>
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
            </ClickAway>
        )
    }
}

export default CopyPaster
