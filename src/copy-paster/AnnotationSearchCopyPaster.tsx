import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { BackgroundSearchParams } from 'src/search/background/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { Template } from './types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    searchParams: BackgroundSearchParams
    getRootElement: () => HTMLElement
}

export default class AnnotationSearchCopyPaster extends React.PureComponent<
    Props
> {
    static defaultProps: Partial<Props> = { copyPasterBG: runInBackground() }

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
