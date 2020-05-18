import React from 'react'
import cx from 'classnames'
import { browser } from 'webextension-polyfill-ts'
import {
    SearchTypeChange,
    SearchType,
    PageType,
} from '../containers/sidebar/types'

const commentAdd = browser.extension.getURL('/img/comment_add.svg')

const styles = require('./search-type-switch.css')

export interface StateProps {
    showAnnotationsForOtherPage: boolean
    allAnnotationsExpanded: boolean
    resultsSearchType: SearchType
    searchType: SearchType
    pageType: PageType
    pageCount?: number
    annotCount?: number
}

export interface DispatchProps {
    handleAllAnnotationsFoldToggle: React.MouseEventHandler<HTMLButtonElement>
    setAnnotationsExpanded: (value: boolean) => void
    handlePageTypeToggle: () => Promise<void>
    handleSwitch: (changes: SearchTypeChange) => Promise<void>
}

export interface OwnProps {
    isOverview?: boolean
    handleAddPageCommentBtnClick: () => void
    showSocialSearch: boolean
}

export type SearchTypeSwitchProps = StateProps & DispatchProps & OwnProps

export default class SearchTypeSwitch extends React.Component<
    SearchTypeSwitchProps
> {
    get unfoldBtnText() {
        return this.props.allAnnotationsExpanded ? 'Fold All' : 'Unfold All'
    }

    get isPageSearch() {
        return this.props.searchType === 'page'
    }

    get isCurrentPageSearch() {
        return this.props.pageType === 'all'
    }

    renderSearchCount(count?: number) {
        if (!count) {
            return null
        }

        return <span className={styles.searchCount}>{count}</span>
    }

    private handleAllBtnClick = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        await this.props.handleSwitch({
            pageType: 'all',
            resultsSearchType: 'notes',
        })
        this.props.setAnnotationsExpanded(true)
    }

    private handlePagesBtnClick = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        await this.props.handleSwitch({
            searchType: 'page',
            resultsSearchType: 'page',
            pageType: 'all',
        })
        this.props.setAnnotationsExpanded(false)
    }

    private handleNotesBtnClick = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        await this.props.handleSwitch({ searchType: 'notes', pageType: 'page' })
    }

    private handleSocialBtnClick = async (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        await this.props.handleSwitch({
            searchType: 'social',
            resultsSearchType: 'social',
            pageType: 'all',
        })
        this.props.setAnnotationsExpanded(false)
    }

    render() {
        return (
            <React.Fragment>
                <div className={styles.masterContainer}>
                    <div className={styles.container}>
                        <div>
                            <button
                                className={cx(
                                    styles.searchSwitchBtn,
                                    styles.btn,
                                    styles.pages,
                                )}
                                onClick={this.handlePagesBtnClick}
                                disabled={this.isPageSearch}
                                id="pages"
                            >
                                Pages
                            </button>
                            {this.props.showSocialSearch && (
                                <button
                                    className={cx(
                                        styles.searchSwitchBtn,
                                        styles.btn,
                                        styles.pages,
                                    )}
                                    onClick={this.handleSocialBtnClick}
                                    disabled={
                                        this.props.searchType === 'social'
                                    }
                                    id="social"
                                >
                                    Social
                                </button>
                            )}
                            <button
                                className={cx(
                                    styles.searchSwitchBtn,
                                    styles.btn,
                                    styles.notesBtn,
                                )}
                                onClick={this.handleNotesBtnClick}
                                disabled={this.props.searchType === 'notes'}
                            >
                                Notes
                            </button>
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                                this.props.handleAddPageCommentBtnClick()
                            }}
                            className={styles.imgContainer}
                        >
                            <img src={commentAdd} className={styles.img} />
                        </div>
                    </div>
                    <div className={styles.notesBox}>
                        {!this.props.showAnnotationsForOtherPage &&
                            this.props.searchType === 'notes' && (
                                <div className={styles.pageSwitch}>
                                    <div>
                                        <button
                                            className={cx(
                                                styles.searchSwitchBtn,
                                                styles.btn,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                this.props.handlePageTypeToggle()
                                            }}
                                            disabled={!this.isCurrentPageSearch}
                                        >
                                            This page
                                        </button>
                                        <button
                                            className={cx(
                                                styles.searchSwitchBtn,
                                                styles.btn,
                                            )}
                                            onClick={this.handleAllBtnClick}
                                            disabled={this.isCurrentPageSearch}
                                        >
                                            All
                                        </button>
                                    </div>
                                    <div>
                                        {this.isCurrentPageSearch && (
                                            <button
                                                className={cx(
                                                    styles.unfoldAllBtn,
                                                    styles.btn,
                                                )}
                                                onClick={
                                                    this.props
                                                        .handleAllAnnotationsFoldToggle
                                                }
                                                disabled={this.isPageSearch}
                                            >
                                                {this.unfoldBtnText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
