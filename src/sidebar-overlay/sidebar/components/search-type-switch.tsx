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

const styles = require('./search-type-switch.css')

export interface StateProps {
    annotsFolded: boolean
    searchType: 'notes' | 'pages'
    pageType: 'page' | 'all'
    pageCount?: number
    annotCount?: number
}

export interface DispatchProps {
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handleSearchTypeClick: React.MouseEventHandler<HTMLButtonElement>
    handlePageTypeClick: React.MouseEventHandler<HTMLButtonElement>
    setPageType: (value: 'page' | 'all') => void
    setResultsSearchType: (value: 'page' | 'annot') => void
    setAnnotationsExpanded: (value: boolean) => void
}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

export class SearchTypeSwitch extends React.PureComponent<Props> {
    get unfoldBtnText() {
        return this.props.annotsFolded ? 'Fold All' : 'Unfold All'
    }

    get isPageSearch() {
        return this.props.searchType === 'pages'
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
        this.props.setResultsSearchType('annot')
        this.props.setAnnotationsExpanded(true)
    }

    private handlePagesBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        this.props.handleSearchTypeClick(event)
        this.props.setResultsSearchType('page')
        this.props.setPageType('all')
        this.props.setAnnotationsExpanded(false)
    }

    private handleNotesBtnClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        this.props.handleSearchTypeClick(event)
        this.props.setPageType('page')
    }

    render() {
        return (
            <React.Fragment>
                <div className={styles.container}>
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
                    <button
                        className={cx(styles.searchSwitchBtn, styles.btn, styles.notesBtn)}
                        onClick={this.handleNotesBtnClick}
                        disabled={!this.isPageSearch}
                    >
                        Notes
                    </button>
                </div>
                {!this.isPageSearch && (
                    <div className={styles.pageSwitch}>
                        <span>
                            <button
                                className={cx(styles.searchSwitchBtn, styles.btn)}
                                onClick={this.props.handlePageTypeClick}
                                disabled={!this.isCurrentPageSearch}
                            >
                                This page
                            </button>
                            <button
                                className={cx(styles.searchSwitchBtn, styles.btn)}
                                onClick={this.handleAllBtnClick}
                                disabled={this.isCurrentPageSearch}
                            >
                                All
                            </button>
                        </span>
                        <span>
                            {this.isCurrentPageSearch && (
                                <button
                                    className={cx(styles.unfoldAllBtn, styles.btn)}
                                    onClick={this.props.handleUnfoldAllClick}
                                    disabled={this.isPageSearch}
                                >
                                    {this.unfoldBtnText}
                                </button>
                            )}
                        </span>
                    </div>
                )}
            </React.Fragment>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    annotsFolded: resultsSelectors.areAnnotationsExpanded(state),
    searchType: selectors.searchType(state),
    pageType: selectors.pageType(state),
})

const mapDispatch: MapDispatchToProps<DispatchProps, OwnProps> = dispatch => ({
    handleSearchTypeClick: e => {
        e.preventDefault()
        dispatch(actions.toggleSearchType() as any)
        dispatch(resultsActs.setLoading(true))
    },
    handlePageTypeClick: e => {
        e.preventDefault()
        dispatch(actions.togglePageType() as any)
    },
    setPageType: value => {
        dispatch(actions.setPageType(value))
    },
    handleUnfoldAllClick: e => {
        e.preventDefault()
        dispatch(resultsActs.toggleAreAnnotationsExpanded())
    },
    setResultsSearchType: value => dispatch(resultsActs.setSearchType(value)),
    setAnnotationsExpanded: value =>
        dispatch(resultsActs.setAreAnnotationsExpanded(value)),
})

export default connect(
    mapState,
    mapDispatch,
)(SearchTypeSwitch)
