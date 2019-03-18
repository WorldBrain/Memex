import React from 'react'
import cx from 'classnames'

const styles = require('./search-type-switch.css')

export interface Props {
    annotsFolded: boolean
    searchType: 'page' | 'annot'
    pageCount?: number
    annotCount?: number
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handleSearchTypeClick: React.MouseEventHandler<HTMLButtonElement>
}

export class SearchTypeSwitch extends React.PureComponent<Props> {
    get unfoldBtnText() {
        return this.props.annotsFolded ? 'Fold All' : 'Unfold All'
    }

    get isPageSearch() {
        return this.props.searchType === 'page'
    }

    renderSearchCount(count?: number) {
        if (!count) {
            return null
        }

        return <span className={styles.searchCount}>{count}</span>
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.switchContainer}>
                    <button
                        className={cx(styles.searchSwitchBtn, styles.btn, styles.pages)}
                        onClick={this.props.handleSearchTypeClick}
                        disabled={this.isPageSearch}
                        id='pages'
                    >
                        {this.renderSearchCount(this.props.pageCount)}
                        Pages
                    </button>
                    <button
                        className={cx(styles.searchSwitchBtn, styles.btn)}
                        onClick={this.props.handleSearchTypeClick}
                        disabled={!this.isPageSearch}
                    >
                        {this.renderSearchCount(this.props.annotCount)}
                        Notes
                    </button>
                </div>
                <button
                    className={cx(styles.unfoldAllBtn, styles.btn)}
                    onClick={this.props.handleUnfoldAllClick}
                    disabled={this.isPageSearch}
                >
                    {this.unfoldBtnText}
                </button>
            </div>
        )
    }
}
