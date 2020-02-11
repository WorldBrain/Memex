import * as React from 'react'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Page } from '../types'
import { browser } from 'webextension-polyfill-ts'

const styles = require('./page-info.css')

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
            url !== normalizeUrl(window.location.href) &&
            this.props.isCurrentPage
        )
    }

    get hrefToPage() {
        const { url } = this.props.page
        return `https://${url}`
    }

    render() {
        const { url, title } = this.props.page
        const backImg = browser.extension.getURL('/img/back.svg')
        return (
            <React.Fragment>
                {this.showPageInfo && (
                    <div className={styles.pageInfoDiv}>
                        <div
                            className={styles.goBackBtn}
                            onClick={this.props.resetPage}
                        >
                            <img src={backImg} className={styles.backButton}/>
                        </div>
                        <div className={styles.pageInfo}>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className={styles.title}
                                title={title}
                            >
                                {title}
                            </a>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className={styles.url}
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
