import React from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import { remoteFunction } from 'src/util/webextensionRPC'
import { renderHighlights } from 'src/highlighting/ui/highlight-interactions'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import { readable } from 'src/util/remote-functions-background'

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

    getHostName() {
        const url = this.props.fullUrl
        const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i)
        if (
            match != null &&
            match.length > 2 &&
            typeof match[2] === 'string' &&
            match[2].length > 0
        ) {
            return match[2]
        } else {
            return null
        }
    }

    renderArticle = (article) => {
        const readingTime = Math.floor(article.length / 5 / 268)

        const hostName = this.getHostName()

        const HTML =
            '<div>' +
            '<h1>' +
            article.title +
            '</h1>' +
            '<span id="readingTime">' +
            readingTime +
            ' min' +
            '</span>' +
            '<span id="separator"> - </span>' +
            '<span id="domain">' +
            hostName +
            '</span>' +
            '<span id="separator"> - </span>' +
            '<span id="visitUrl">' +
            '<a target="_blank" href="' +
            this.props.fullUrl +
            '">Visit Original</a>' +
            '</span>' +
            '<div id="hLine"></div>' +
            '<div>' +
            ((article.content?.length ?? 0) === 0)
                ? article.textContent
                : article.content + '</div>' + '</div>'

        this.setState({ readerHtml: { __html: HTML } })
        // this._readerContainerRef.current.innerHTML = HTML
    }

    render() {
        if (this.state.loading) {
            return <LoadingIndicator />
        }

        return (
            <ViewerContainer
                ref={(ref) => (this._readerContainerRef = ref)}
                dangerouslySetInnerHTML={this.state.readerHtml}
            />
        )
    }
}

const ViewerContainer = styled.div`
    color: #3a2f45;

    & img {
        max-width: 800px !important;
        width: 80%;
        margin: 20px 20px;
    }

    & h1 {
        margin-bottom: 0.3em;
    }

    & h1 > span {
        font-size: 26px;
        font-weight: 600;
    }

    & #hLine {
        border-bottom: 1px #cacaca solid
        width: 100%
    }

    & blockquote {
        font-style: italic;
        font-weight: 400;
        background: #ececec;
        border-radius: 8px;
        padding: 10px 35px;

        & span,
            p,
            div,
            a {
            font-style: italic;
            font-weight: 400;
        }
    }

    & figcaption {

        font-size: 14px;

        & span, p, div {
            font-size: 14px;
        }
    }

    & h2 > span {
        font-size: 22px;
        font-weight: 600;
    }

    & h3 > span {
        font-size: 20px;
        font-weight: 600;
    }

    & picture {
        display: flex;
        justify-content: center;
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
        width: 100%;
        max-width: 800px;
    }

    & #separator {
        padding: 0 10px
    }

    & #readingTime {
        font-weight: 600;
    }

    & table {
        width: 100%;
        max-width: 800px;
    }
`
