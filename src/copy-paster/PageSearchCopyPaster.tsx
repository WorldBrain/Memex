import React from 'react'

import CopyPaster, { Props as CopyPasterProps } from './CopyPaster'
import { BackgroundSearchParams } from 'src/search/background/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { Template } from './types'

export interface Props extends Omit<CopyPasterProps, 'renderTemplate'> {
    searchParams: BackgroundSearchParams
    preventClosingBcEditState?: (state: boolean) => void
}

export default class PageSearchCopyPaster extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = { copyPasterBG: runInBackground() }

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
