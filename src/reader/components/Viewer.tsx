import React from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import { fetchDOMFromUrl } from 'src/page-analysis/background/fetch-page-data'
import Readability from 'readability/Readability'
import { remoteFunction } from 'src/util/webextensionRPC'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import { readable } from 'src/util/remote-functions-background'
import { now } from 'moment'
import { message } from 'openpgp'
import read = message.read

interface Props {
    fullUrl: string
}

interface State {
    loading: boolean
    readerHtml: { __html: string }
}

export default class Viewer extends React.Component<Props, State> {
    state = { loading: true, readerHtml: null }
    private _readerContainerRef: React.RefObject<HTMLDivElement>

    async componentDidMount() {
        const url = this.props.fullUrl
        const article = (await readable.readableExists(url))
            ? await readable.getReadableVersion(url)
            : await readable.parseAndSaveReadable({ fullUrl: url })

        await this.renderArticle(article)
        this.setState({ loading: false })

        // load annotations
        await this.loadAndRenderAnnotations(this.props.fullUrl)
    }

    loadAndRenderAnnotations = async (fullUrl) => {
        const annots = await remoteFunction('getAllAnnotationsByUrl')({
            url: fullUrl,
        })
        // console.log(`Found ${annots?.length} annots for url`)
        // console.dir(annots)
        const highlightables = annots.filter(
            (annotation) => annotation.selector,
        )
        await renderHighlights(highlightables, () => null)
    }

    renderArticle = (article) => {
        this.setState({ readerHtml: { __html: article.content } })
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator />
        }

        return (
            <ViewerContainer
                ref={(ref) => this._readerContainerRef}
                dangerouslySetInnerHTML={this.state.readerHtml}
            />
        )
    }
}

const ViewerContainer = styled.div`
    & img {
        max-width: 400px !important;
        margin: auto auto;
    }

    & p,
    div,
    span {
        font-style: normal;
        font-weight: 300;
        font-size: 18px;
        line-height: 1.4;
        margin-top: 20px;
        text-align: left;
        color: ${colorText};
    }
`
