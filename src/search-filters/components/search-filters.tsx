import React, { PureComponent } from 'react'
import cx from 'classnames'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const styles = require('./search-filters.css')

interface Props {
    tagFilter: React.ReactNode
    hashtagsFilter: React.ReactNode
    dateFilter: React.ReactNode
    domainFilter: React.ReactNode
    userFilter: React.ReactNode
    contentFilter: React.ReactNode
    bookmarkFilter: React.ReactNode
    toggleFilterBar: () => void
}

interface State {}

class SearchFilters extends PureComponent<Props, State> {
    render() {
        return (
            <div className={styles.filterBar}>
                <div className={styles.innerContainer}>
                    <div className={styles.filters}>
                        {this.props.bookmarkFilter}
                        {this.props.dateFilter}
                        {this.props.tagFilter}
                        {this.props.domainFilter}
                        {this.props.userFilter}
                        {this.props.hashtagsFilter}
                        {this.props.contentFilter}
                    </div>
                    <TooltipBox
                        tooltipText="Close Filter Bar"
                        placement="bottom"
                    >
                        <div
                            className={cx(styles.button, styles.arrow)}
                            onClick={() => this.props.toggleFilterBar()}
                        />
                    </TooltipBox>
                </div>
            </div>
        )
    }
}

export default SearchFilters
