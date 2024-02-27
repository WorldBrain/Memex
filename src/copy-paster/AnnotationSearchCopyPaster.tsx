import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { BackgroundSearchParams } from 'src/search/background/types'
import type { Template } from './types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    searchParams: BackgroundSearchParams
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
