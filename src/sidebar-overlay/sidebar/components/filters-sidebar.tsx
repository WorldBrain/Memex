import React, { Component } from 'react'
import ListSideBar from './lists-container'
import {
    BookmarkFilter,
    TagsFilter,
    DomainsFilter,
    DatesFilter,
    UsersFilter,
    ContentTypeContainer,
    HashtagsFilter,
} from 'src/search-filters/components'
import { ButtonTooltip } from 'src/common-ui/components/'
import { Props } from './filters-sidebar-container'
import cx from 'classnames'

const styles = require('./filters-sidebar.css')

interface State {}

class FiltersSidebar extends Component<Props, State> {
    private filtersRef: HTMLDivElement

    componentDidMount() {
        this.props.fetchSuggestedTags()
        this.props.fetchSuggestedDomains()
        this.props.fetchSuggestedUsers()
        this.props.fetchSuggestedHashtags()
        this.filtersRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    componentWillUnmount() {
        this.filtersRef.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    private setFiltersRef = (ref: HTMLDivElement) => {
        this.filtersRef = ref
    }

    private handleMouseLeave = () => {
        this.props.resetFilterPopups()
    }

    private renderListSidebar() {
        return (
            <div className={styles.listsDiv}>
                <ListSideBar env={this.props.env} />
            </div>
        )
    }

    render() {
        return (
            <div
                ref={this.setFiltersRef}
                className={cx(styles.filtersSidebar, {
                    [styles.filtersSidebarOverview]:
                        this.props.env === 'overview',
                })}
            >
                <div className={styles.filtersNav}>
                    <span className={styles.filterTitle}>
                        Filters
                        {this.props.showClearFiltersBtn && (
                            <ButtonTooltip
                                position="right"
                                tooltipText={'Clear filters'}
                            >
                                <span
                                    className={styles.clearFilters}
                                    onClick={this.props.clearAllFilters}
                                />
                            </ButtonTooltip>
                        )}
                    </span>
                    <ButtonTooltip
                        tooltipText={'Close filters sidebar'}
                        position="right"
                    >
                        <button
                            className={styles.arrow}
                            onClick={this.props.toggleShowFilters}
                        />
                    </ButtonTooltip>
                </div>
                <div className={styles.filters}>
                    <div className={styles.filterDiv}>
                        <BookmarkFilter />
                    </div>
                    <div className={styles.filterDiv}>
                        <DatesFilter tooltipPosition="inpage" env="inpage" />
                    </div>
                    <div className={styles.filterDiv}>
                        <TagsFilter tooltipPosition="inpage" env="inpage" />
                    </div>
                    {!this.props.isSocialSearch && (
                        <div className={styles.filterDiv}>
                            <DomainsFilter
                                tooltipPosition="inpage"
                                env="inpage"
                            />
                        </div>
                    )}
                    <div className={styles.filterDiv}>
                        <ContentTypeContainer
                            tooltipPosition="inpage"
                            env="inpage"
                        />
                    </div>
                    <div className={styles.filterDiv}>
                        <UsersFilter tooltipPosition="inpage" env="inpage" />
                    </div>
                    <div className={styles.filterDiv}>
                        <HashtagsFilter tooltipPosition="inpage" env="inpage" />
                    </div>
                </div>
            </div>
        )
    }
}

export default FiltersSidebar
