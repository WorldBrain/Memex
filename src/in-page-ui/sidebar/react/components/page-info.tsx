import * as React from 'react'
import { browser } from 'webextension-polyfill-ts'

const styles = require('./page-info.css')

interface Props {
    pageTitle: string
    pageUrl: string
    resetPage: () => void
}

class PageInfo extends React.Component<Props> {
    get hrefToPage() {
        return `https://${this.props.pageUrl}`
    }

    render() {
        const backImg = browser.extension.getURL('/img/back.svg')
        return (
            <div className={styles.pageInfoDiv}>
                <div
                    className={styles.goBackBtn}
                    onClick={this.props.resetPage}
                >
                    <img src={backImg} className={styles.backButton} />
                </div>
                <div className={styles.pageInfo}>
                    <a
                        target="_blank"
                        href={this.hrefToPage}
                        className={styles.title}
                        title={this.props.pageTitle}
                    >
                        {this.props.pageTitle}
                    </a>
                    <a
                        target="_blank"
                        href={this.hrefToPage}
                        className={styles.url}
                        title={this.props.pageUrl}
                    >
                        {this.props.pageUrl}
                    </a>
                </div>
            </div>
        )
    }
}

export default PageInfo
