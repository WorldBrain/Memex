import * as React from 'react'
import { Page } from '../types'
import normalizeUrl from 'src/util/encode-url-for-id'

import cx from 'classnames'

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
                        <span className={styles.pageInfo}>
                            {title} - {url}
                        </span>
                    </div>
                )}
            </React.Fragment>
        )
    }
}

export default PageInfo
