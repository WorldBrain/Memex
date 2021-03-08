import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    normalizedPageUrls: string[]
    annotationUrls?: string[]
    copyPaster: RemoteCopyPasterInterface
}

export default class PageNotesCopyPaster extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        annotationUrls: [],
    }

    private renderTemplate = (id: number) =>
        this.props.copyPaster.renderTemplate({
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
