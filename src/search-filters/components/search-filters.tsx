import React, { PureComponent } from 'react'
import cx from 'classnames'
import { ButtonTooltip } from 'src/common-ui/components/'

const styles = require('./search-filters.css')

interface Props {
    tagFilter: React.ReactNode
    dateFilter: React.ReactNode
    domainFilter: React.ReactNode
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
                        <div className={styles.bookmarksFilter}>
                            {this.props.bookmarkFilter}
                        </div>
                        {this.props.dateFilter}
                        {this.props.tagFilter}
                        {this.props.domainFilter}
                        {this.props.contentFilter}
                    </div>
                    <ButtonTooltip
                        tooltipText="Close Filter Bar"
                        position="bottom"
                    >
                        <button
                            className={cx(styles.button, styles.arrow)}
                            onClick={() => this.props.toggleFilterBar()}
                        />
                    </ButtonTooltip>
                </div>
            </div>
        )
    }
}

export default SearchFilters
