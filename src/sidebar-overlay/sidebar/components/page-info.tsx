import * as React from 'react'

import { Page } from '../types'

const styles = require('./page-info.css')

interface Props extends Page {
    resetPage: React.MouseEventHandler<HTMLButtonElement>
}

class PageInfo extends React.Component<Props> {
    private get hrefToPage() {
        return this.props.url.startsWith('https://')
            ? this.props.url
            : `https://${this.props.url}`
    }

    render() {
        return (
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
        )
    }
}

export default PageInfo
