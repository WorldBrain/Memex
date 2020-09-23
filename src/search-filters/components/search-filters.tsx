import React, { PureComponent } from 'react'
import cx from 'classnames'
import { ButtonTooltip } from 'src/common-ui/components/'

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
                        {/*{this.props.bookmarkFilter}*/}
                        {this.props.dateFilter}
                        {this.props.tagFilter}
                        {this.props.domainFilter}
                        {this.props.userFilter}
                        {this.props.hashtagsFilter}
                        {this.props.contentFilter}
                    </div>
                    <ButtonTooltip
                        tooltipText="Close Filter Bar"
                        position="bottom"
                    >
                        <div
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
