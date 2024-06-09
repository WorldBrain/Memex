import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { Template } from './types'
import type { UnifiedSearchParams } from '@worldbrain/memex-common/lib/search/types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    searchParams: UnifiedSearchParams
}

export default class AnnotationSearchCopyPaster extends React.PureComponent<
    Props
> {
    private renderTemplate = (id: number) =>
        this.props.copyPasterBG.renderTemplateForAnnotationSearch({
            id,
            searchParams: this.props.searchParams,
        })

    private renderPreview = (template: Template, templateType: string) =>
        this.props.copyPasterBG.renderPreviewForAnnotationSearch({
            template,
            searchParams: this.props.searchParams,
            templateType,
        })

    render() {
        return (
            <CopyPaster
                {...this.props}
                renderPreview={this.renderPreview}
                renderTemplate={this.renderTemplate}
            />
        )
    }
}
