import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { Template } from './types'
import type { UnifiedSearchParams } from '@worldbrain/memex-common/lib/search/types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    searchParams: UnifiedSearchParams
}

export default class PageSearchCopyPaster extends React.PureComponent<Props> {
    private renderTemplate = (id: number) =>
        this.props.copyPasterBG.renderTemplateForPageSearch({
            id,
            searchParams: this.props.searchParams,
        })

    private renderPreview = (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) =>
        this.props.copyPasterBG.renderPreviewForPageSearch({
            template,
            searchParams: this.props.searchParams,
            templateType: templateType,
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
