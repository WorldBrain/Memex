import React from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import { fetchDOMFromUrl } from 'src/page-analysis/background/fetch-page-data'
import Readability from 'readability/Readability'

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
        const doc = await this.fetchDocument(this.props.fullUrl)
        const article = await this.parseDocument(doc)
        await this.renderArticle(article)
        this.setState({ loading: false })
    }

    fetchDocument = async (fullUrl) => fetchDOMFromUrl(fullUrl, 5000).run()

    parseDocument = (doc) => {
        window.performance.mark('StartReaderParse')
        const article = new Readability(doc).parse()
        window.performance.mark('EndReaderParse')
        window.performance.measure(
            'Reader Parsing',
            'StartReaderParse',
            'EndReaderParse',
        )
        return article
    }
    renderArticle = (article) => {
        this.setState({ readerHtml: { __html: article.content } })
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator />
        }

        return (
            <div
                ref={(ref) => this._readerContainerRef}
                dangerouslySetInnerHTML={this.state.readerHtml}
            ></div>
        )
    }
}
