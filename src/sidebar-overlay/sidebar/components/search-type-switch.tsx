import React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RootState, { MapDispatchToProps } from 'src/sidebar-overlay/types'
import {
    acts as resultsActs,
    selectors as resultsSelectors,
} from 'src/overview/results'
import cx from 'classnames'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { browser } from 'webextension-polyfill-ts'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

const commentAdd = browser.extension.getURL('/img/comment_add.svg')

const styles = require('./search-type-switch.css')

export interface StateProps {
    annotsFolded: boolean
    resultsSearchType: 'page' | 'notes' | 'social'
    searchType: 'notes' | 'page' | 'social'
    pageType: 'page' | 'all'
    pageCount?: number
    annotCount?: number
}

export interface DispatchProps {
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handlePageTypeClick: React.MouseEventHandler<HTMLButtonElement>
    setSearchType: (value: 'notes' | 'page' | 'social') => void
    setPageType: (value: 'page' | 'all') => void
    setResultsSearchType: (value: 'page' | 'notes' | 'social') => void
    setAnnotationsExpanded: (value: boolean) => void
}

export interface OwnProps {
    isOverview?: boolean
    handleAddCommentBtnClick: () => void
    showSocialSearch: boolean
}

export type Props = StateProps & DispatchProps & OwnProps

export class SearchTypeSwitch extends React.PureComponent<Props> {
    get unfoldBtnText() {
        return this.props.annotsFolded ? 'Fold All' : 'Unfold All'
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

    private handleAllBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        this.props.handlePageTypeClick(event)
        if (this.props.resultsSearchType !== 'notes') {
            this.props.setResultsSearchType('notes')
        }
        this.props.setAnnotationsExpanded(true)
    }

    private handlePagesBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        this.props.setSearchType('page')

        this.props.setResultsSearchType('page')
        this.props.setPageType('all')
        this.props.setAnnotationsExpanded(false)
    }

    private handleNotesBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        this.props.setSearchType('notes')
        this.props.setPageType('page')
    }

    private handleSocialBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault()
        this.props.setSearchType('social')
        this.props.setResultsSearchType('social')
        this.props.setPageType('all')
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
                                    disabled={this.props.searchType === 'social'}
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
                            onClick={e => {
                                e.stopPropagation()
                                this.props.handleAddCommentBtnClick()
                            }}    
                            className={
                                styles.imgContainer
                            }
                            > 
                            <img src={commentAdd} className={styles.img}/>        
                        </div>
                    </div>
                    <div className={styles.notesBox}>
                        {this.props.searchType === 'notes' && (
                            <div className={styles.pageSwitch}>
                                <div>
                                    <button
                                        className={cx(
                                            styles.searchSwitchBtn,
                                            styles.btn,
                                        )}
                                        onClick={this.props.handlePageTypeClick}
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
                                                this.props.handleUnfoldAllClick
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

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
    props,
) => ({
    annotsFolded: resultsSelectors.areAnnotationsExpanded(state),
    searchType: !props.isOverview
        ? selectors.searchType(state)
        : resultsSelectors.searchType(state),
    pageType: selectors.pageType(state),
    resultsSearchType: resultsSelectors.searchType(state),
})

const mapDispatch: MapDispatchToProps<DispatchProps, OwnProps> = dispatch => ({
    handlePageTypeClick: e => {
        e.preventDefault()
        dispatch(actions.togglePageType() as any)
    },
    setSearchType: value => {
        dispatch(actions.setSearchType(value))
    },
    setPageType: value => {
        dispatch(actions.setPageType(value))
    },
    handleUnfoldAllClick: e => {
        e.preventDefault()
        dispatch(resultsActs.toggleAreAnnotationsExpanded())
    },
    setResultsSearchType: value => {
        dispatch(resultsActs.setLoading(true))
        dispatch(resultsActs.setSearchType(value))
    },
    setAnnotationsExpanded: value =>
        dispatch(resultsActs.setAreAnnotationsExpanded(value)),
})

export default connect(mapState, mapDispatch)(SearchTypeSwitch)
