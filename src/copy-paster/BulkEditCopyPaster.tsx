import React from 'react'
import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import type { BackgroundSearchParams } from 'src/search/background/types'
import type { Template } from './types'

export interface Props
    extends Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'> {
    normalizedPageUrls: string[]
    annotationUrls: string[]
}

export default class BulkEditCopyPaster extends React.PureComponent<Props> {
    private renderTemplate = async (id: number) => {
        console.log(
            'rendertemplate',
            id,
            this.props.annotationUrls ?? [],
            this.props.normalizedPageUrls,
        )
        const output = await this.props.copyPasterBG.renderTemplate({
            id,
            annotationUrls: this.props.annotationUrls ?? [],
            normalizedPageUrls: this.props.normalizedPageUrls,
        })
        console.log('output', output)
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
