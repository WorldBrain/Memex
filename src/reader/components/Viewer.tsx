import React from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import { readable } from 'src/util/remote-functions-background'
import { AnnotationsSidebarInDashboardResults } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'
import { AnnotationsSidebarInContentReader } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInContentReader'
import {
    AnnotationsCacheInterface,
    createAnnotationsCache,
} from 'src/annotations/annotations-cache'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/annotations/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationsSidebarContainer } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarContainer'

interface Props {
    fullUrl: string
    onInit?: ({ url }) => void
}

interface State {
    loading: boolean
    readerHtml: { __html: string }
}

export default class Viewer extends React.Component<Props, State> {
    private annotationsCache: AnnotationsCacheInterface
    private annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    private customListsBG = runInBackground<RemoteCollectionsInterface>()
    private tagsBG = runInBackground<RemoteTagsInterface>()

    private annotationsSidebarRef = React.createRef<
        AnnotationsSidebarContainer
    >()
    get annotationsSidebar(): AnnotationsSidebarContainer {
        return this.annotationsSidebarRef.current
    }

    state = { loading: true, readerHtml: null }
    private _readerContainerRef: React.RefObject<HTMLDivElement>

    constructor(props: Props) {
        super(props)

        this.annotationsCache = createAnnotationsCache({
            annotations: this.annotationsBG,
            tags: this.tagsBG,
        })
    }

    private handleCloseSidebarBtnClick: React.MouseEventHandler = (e) => {
        this.annotationsSidebar.hideSidebar()
    }

    async componentDidMount() {
        const url = this.props.fullUrl
        const article = (await readable.readableExists(url))
            ? await readable.getReadableVersion(url)
            : await readable.parseAndSaveReadable({ fullUrl: url })

        await this.renderArticle(article)

        this.annotationsSidebar.setPageUrl(this.props.fullUrl)
        this.annotationsSidebar.showSidebar()

        this.setState({ loading: false })

        this.props?.onInit({ url })
    }

    getHostName() {
        return new URL(this.props.fullUrl).hostname
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
            // ((article.content?.length ?? 0) === 0)
            //     ? article.textContent
            //     : article.content + '</div>' + '</div>'
            article.content +
            '</div>' +
            '</div>'

        this.setState({ readerHtml: { __html: HTML } })
        // this._readerContainerRef.current.innerHTML = HTML
    }

    render() {
        return (
            <>
                {this.state.loading ? (
                    <LoadingIndicator />
                ) : (
                    <Content
                        ref={(ref) => (this._readerContainerRef = ref)}
                        dangerouslySetInnerHTML={this.state.readerHtml}
                    />
                )}
                <AnnotationsSidebarInContentReader
                    tags={this.tagsBG}
                    annotations={this.annotationsBG}
                    customLists={this.customListsBG}
                    refSidebar={this.annotationsSidebarRef}
                    annotationsCache={this.annotationsCache}
                    onCloseSidebarBtnClick={this.handleCloseSidebarBtnClick}
                />
            </>
        )
    }
}

const Content = styled.div`
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
