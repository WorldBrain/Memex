import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { runInBackground } from 'src/util/webextensionRPC'
import { Template } from './types'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    normalizedPageUrls: string[]
    annotationUrls?: string[]
    setLoadingState: (loading: UITaskState) => void
}

export default class PageNotesCopyPaster extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        annotationUrls: [],
        copyPasterBG: runInBackground(),
    }

    private renderTemplate = (id: number) =>
        this.props.copyPasterBG.renderTemplate({
            id,
            annotationUrls: this.props.annotationUrls,
            normalizedPageUrls: this.props.normalizedPageUrls,
        })
    private renderPreview = async (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => {
        let returnValue: string
        try {
            returnValue = await this.props.copyPasterBG.renderPreview({
                template,
                annotationUrls: this.props.annotationUrls,
                normalizedPageUrls: this.props.normalizedPageUrls,
                templateType: templateType,
            })
        } catch (e) {
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
                setLoadingState={this.props.setLoadingState}
            />
        )
    }
}
