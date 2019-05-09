import * as React from 'react'
import { Page } from '../types'
import normalizeUrl from 'src/util/encode-url-for-id'

import cx from 'classnames'

const styles = require('./page-info.css')

interface Props extends Page {
    isCurrentPage: boolean
    resetPage: React.MouseEventHandler<HTMLButtonElement>
}

class PageInfo extends React.Component<Props> {
    get showPageInfo() {
        return (
            this.props.url &&
            this.props.url !== normalizeUrl(location.href) &&
            this.props.isCurrentPage
        )
    }

    get hrefToPage() {
        return this.props.url.startsWith('https://')
            ? this.props.url
            : `https://${this.props.url}`
    }

    render() {
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
                                {this.props.title}
                            </a>
                            <a
                                target="_blank"
                                href={this.hrefToPage}
                                className={styles.url}
                            >
                                {this.props.url}
                            </a>
                        </div>
                    </div>
                )}
            </React.Fragment>
        )
    }
}

export default PageInfo
