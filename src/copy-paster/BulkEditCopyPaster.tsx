import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { Template } from './types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    normalizedPageUrls: string[]
    annotationUrls: string[]
}

export default class BulkEditCopyPaster extends React.PureComponent<Props> {
    private renderTemplate = async (id: number) => {
        const output = await this.props.copyPasterBG.renderTemplate({
            id,
            annotationUrls: this.props.annotationUrls ?? [],
            normalizedPageUrls: this.props.normalizedPageUrls,
        })
        return output
    }

    private renderPreview = (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) =>
        this.props.copyPasterBG.renderPreview({
            template,
            annotationUrls: this.props.annotationUrls,
            normalizedPageUrls: this.props.normalizedPageUrls,
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
