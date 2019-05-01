import * as React from 'react'
import { Page } from '../types'
import normalizeUrl from 'src/util/encode-url-for-id'

const styles = require('./page-info.css')

interface Props {
    page: Page
    isCurrentPage: boolean
    resetPage: React.MouseEventHandler<HTMLButtonElement>
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
        return (
            <React.Fragment>
                {this.showPageInfo && (
                    <div className={styles.pageInfoDiv}>
                        <button
                            className={styles.goBackBtn}
                            onClick={this.props.resetPage}
                        >
                            Go back
                        </button>
                        <div className={styles.pageInfo}>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className={styles.title}
                            >
                                {title}
                            </a>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className={styles.url}
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
