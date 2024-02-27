import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { BackgroundSearchParams } from 'src/search/background/types'
import type { Template } from './types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    searchParams: BackgroundSearchParams
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
