import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { copyPaster } from 'src/util/remote-functions-background'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    normalizedPageUrls: string[]
    annotationUrls?: string[]
}

export default class PageNotesCopyPaster extends React.PureComponent<Props> {
    private copyPasterBG = copyPaster

    static defaultProps: Partial<Props> = {
        annotationUrls: [],
    }

    private renderTemplate = (id: number) =>
        this.copyPasterBG.renderTemplate({
            id,
            annotationUrls: this.props.annotationUrls,
            normalizedPageUrls: this.props.normalizedPageUrls,
        })

    render() {
        return (
            <CopyPaster {...this.props} renderTemplate={this.renderTemplate} />
        )
    }
}
