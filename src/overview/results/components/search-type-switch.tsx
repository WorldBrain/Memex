import React from 'react'
import cx from 'classnames'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'

import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import * as icons from 'src/common-ui/components/design-library/icons'
import { RootState } from 'src/options/types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { selectors as filters } from 'src/search-filters'
import { selectors as searchBar } from 'src/overview/search-bar'
import { BackgroundSearchParams } from 'src/search/background/types'
import {
    AnnotationSearchCopyPaster,
    PageSearchCopyPaster,
} from 'src/copy-paster'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

const styles = require('./search-type-switch.css')

export interface StateProps {
    annotsFolded: boolean
    showCopyPaster: boolean
    isFilterBarActive: boolean
    showCopyPasterIcon: boolean
    searchParams: BackgroundSearchParams
    searchType: 'page' | 'notes' | 'social'
}

export interface DispatchProps {
    hideCopyPaster: () => void
    handleCopyPasterIconClick: React.MouseEventHandler
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handleSearchTypeClick: (
        searchType: 'page' | 'notes' | 'social',
    ) => React.MouseEventHandler<HTMLButtonElement>
}

export interface OwnProps {
    showSocialSearch: boolean
}

export type Props = StateProps & DispatchProps & OwnProps

export class SearchTypeSwitch extends React.PureComponent<Props> {
    get unfoldBtnText() {
        return this.props.annotsFolded ? 'Collapse All' : 'Expand All'
    }

    get isPageSearch() {
        return this.props.searchType === 'page'
    }

    get isAnnotSearch() {
        return this.props.searchType === 'notes'
    }

    get isSocialSearch() {
        return this.props.searchType === 'social'
    }

    private renderCopyPaster() {
        if (!this.props.showCopyPaster) {
            return null
        }

        const CopyPaster =
            this.props.searchType === 'notes'
                ? AnnotationSearchCopyPaster
                : PageSearchCopyPaster

        return (
            <HoverBox withRelativeContainer right="120px" top="5px">
                <CopyPaster
                    searchParams={this.props.searchParams}
                    onClickOutside={this.props.hideCopyPaster}
                />
            </HoverBox>
        )
    }

    render() {
        return (
            <div
                className={cx(styles.container, {
                    [styles.filterBarActive]: this.props.isFilterBarActive,
                })}
            >
                <div className={styles.switchContainer}>
                    <button
                        className={cx(
                            styles.searchSwitchBtn,
                            styles.btn,
                            styles.pages,
                        )}
                        onClick={this.props.handleSearchTypeClick('page')}
                        disabled={this.isPageSearch}
                        id="pages"
                    >
                        Pages
                    </button>
                    <button
                        className={cx(styles.searchSwitchBtn, styles.btn)}
                        onClick={this.props.handleSearchTypeClick('notes')}
                        disabled={this.isAnnotSearch}
                    >
                        Notes
                    </button>
                    {this.props.showSocialSearch && (
                        <button
                            className={cx(styles.searchSwitchBtn, styles.btn)}
                            onClick={this.props.handleSearchTypeClick('social')}
                            disabled={this.isSocialSearch}
                        >
                            Social
                            <span className={styles.betaBox}>
                                <ButtonTooltip
                                    tooltipText="Saving Tweets is in beta mode. Bugs may appear. Let us know: support@worldbrain.io or github.com/worldbrain"
                                    position="bottom"
                                >
                                    <span className={styles.beta}>beta</span>
                                </ButtonTooltip>
                            </span>
                        </button>
                    )}
                </div>
                <div className={styles.btnsContainer}>
                    {this.isAnnotSearch && (
                        <button
                            className={cx(styles.unfoldAllBtn, styles.btn)}
                            onClick={this.props.handleUnfoldAllClick}
                            disabled={this.isPageSearch}
                        >
                            {this.unfoldBtnText}
                        </button>
                    )}
                    {this.props.showCopyPasterIcon && (
                        <button
                            className={styles.copyPasterBtn}
                            onClick={this.props.handleCopyPasterIconClick}
                        >
                            <img
                                className={styles.copyPasterImg}
                                src={icons.copy}
                            />
                        </button>
                    )}
                    {this.renderCopyPaster()}
                </div>
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    searchType: selectors.searchType(state),
    annotsFolded: selectors.areAnnotationsExpanded(state),
    showCopyPaster: selectors.isResultCopyPasterShown(state),
    isFilterBarActive: filters.showFilterBar(state),
    showCopyPasterIcon: selectors.showCopyPasterIcon(state),
    searchParams: {
        query: searchBar.query(state),
        startDate: searchBar.startDate(state),
        endDate: searchBar.endDate(state),
        showOnlyBookmarks: filters.onlyBookmarks(state),
        tagsInc: filters.tags(state),
        tagsExc: filters.tagsExc(state),
        domains: filters.domainsInc(state),
        domainsExclude: filters.domainsExc(state),
        lists: filters.listFilterParam(state),
        contentTypes: filters.contentType(state),
        usersInc: filters.usersInc(state),
        usersExc: filters.usersExc(state),
        hashtagsInc: filters.hashtagsInc(state),
        hashtagsExc: filters.hashtagsExc(state),
        limit: 0,
        skip: 0,
    },
})

const mapDispatch: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
) => ({
    handleCopyPasterIconClick: (e) => dispatch(acts.toggleResultCopyPaster()),
    hideCopyPaster: () => dispatch(acts.setResultCopyPasterShown(false)),
    handleSearchTypeClick: (searchType) => (e) => {
        e.preventDefault()
        dispatch(acts.setLoading(true))
        dispatch(acts.resetSearchResult())
        dispatch(acts.setSearchType(searchType))
    },
    handleUnfoldAllClick: (e) => {
        e.preventDefault()
        dispatch(acts.toggleAreAnnotationsExpanded())
    },
})

export default connect(mapState, mapDispatch)(SearchTypeSwitch)
