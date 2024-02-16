import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { runInBackground } from 'src/util/webextensionRPC'
import { Template } from './types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    normalizedPageUrls: string[]
    annotationUrls?: string[]
}

export default class PageNotesCopyPaster extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        annotationUrls: [],
        copyPaster: runInBackground(),
    }

    private renderTemplate = (id: number) =>
        this.props.copyPaster.renderTemplate({
            id,
            annotationUrls: this.props.annotationUrls,
            normalizedPageUrls: this.props.normalizedPageUrls,
        })
    private renderPreview = async (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => {
        console.log('before preview')
        let returnValue: string
        try {
            returnValue = await this.props.copyPaster.renderPreview({
                template,
                annotationUrls: this.props.annotationUrls,
                normalizedPageUrls: this.props.normalizedPageUrls,
                templateType: templateType,
            })
        } catch (e) {
            console.log('next step', e)
            throw e
        }
        return returnValue
    }

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
