import React from 'react'
import CopyPaster, {
    Props as CopyPasterProps,
} from 'src/copy-paster/CopyPaster'
import type { Template } from 'src/copy-paster/types'
import PageLinkShareMenuContainer, {
    Props as PageLinkProps,
} from 'src/custom-lists/ui/page-link-share-menu'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

export interface Props {
    copyPasterProps: Omit<CopyPasterProps, 'renderTemplate' | 'renderPreview'>
    pageLinkProps: PageLinkProps
    annotationUrls: string[]
}

export default class PageCitations extends React.PureComponent<Props> {
    private renderTemplate = (id: number) => {
        const { copyPasterProps, pageLinkProps, annotationUrls } = this.props
        const normalizedPageUrl = normalizeUrl(pageLinkProps.fullPageUrl)
        return copyPasterProps.copyPasterBG.renderTemplate({
            id,
            annotationUrls,
            normalizedPageUrls: [normalizedPageUrl],
        })
    }

    private renderPreview = async (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => {
        const { copyPasterProps, pageLinkProps, annotationUrls } = this.props
        const normalizedPageUrl = normalizeUrl(pageLinkProps.fullPageUrl)
        return copyPasterProps.copyPasterBG.renderPreview({
            templateType: templateType,
            template,
            annotationUrls,
            normalizedPageUrls: [normalizedPageUrl],
        })
    }

    render() {
        return (
            <>
                <CopyPaster
                    {...this.props.copyPasterProps}
                    renderPreview={this.renderPreview}
                    renderTemplate={this.renderTemplate}
                />
                <PageLinkShareMenuContainer {...this.props.pageLinkProps} />
            </>
        )
    }
}
