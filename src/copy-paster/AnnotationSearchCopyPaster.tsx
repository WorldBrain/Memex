import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { copyPaster } from 'src/util/remote-functions-background'
import { BackgroundSearchParams } from 'src/search/background/types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    searchParams: BackgroundSearchParams
}

export default class AnnotationSearchCopyPaster extends React.PureComponent<
    Props
> {
    private copyPasterBG = copyPaster

    private renderTemplate = (id: number) =>
        this.copyPasterBG.renderTemplateForAnnotationSearch({
            id,
            searchParams: this.props.searchParams,
        })

    render() {
        return (
            <CopyPaster {...this.props} renderTemplate={this.renderTemplate} />
        )
    }
}
