import * as React from 'react'
import { normalizeUrl } from '@worldbrain/memex-common/ts/url-utils/normalize'
import { Page } from '../types'

import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

interface Props {
    page: Page
    isCurrentPage: boolean
    resetPage: React.MouseEventHandler<HTMLDivElement>
}

class PageInfo extends React.Component<Props> {
    get showPageInfo() {
        const { url } = this.props.page
        return (
            url &&
            url !==
                normalizeUrl(getUnderlyingResourceUrl(window.location.href)) &&
            this.props.isCurrentPage
        )
    }

    get hrefToPage() {
        const { url } = this.props.page
        return `https://${url}`
    }

    render() {
        const { url, title } = this.props.page
        const backImg = chrome.runtime.getURL('/img/back.svg')
        return (
            <React.Fragment>
                {this.showPageInfo && (
                    <div className="pageInfoDiv">
                        <div
                            className="goBackBtn"
                            onClick={this.props.resetPage}
                        >
                            <img src={backImg} className="backButton" />
                        </div>
                        <div className="pageInfo">
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className="title"
                                title={title}
                            >
                                {title}
                            </a>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className="url"
                                title={url}
                            >
                                {url}
                            </a>
                        </div>
                    </div>
                )}
            </React.Fragment>
        )
    }
}

export default PageInfo
