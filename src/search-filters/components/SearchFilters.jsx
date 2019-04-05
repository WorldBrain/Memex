import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from './SearchFilters.css'
import { ButtonTooltip } from 'src/common-ui/components/'

class SearchFilters extends PureComponent {
    static propTypes = {
        tagFilter: PropTypes.node.isRequired,
        dateFilter: PropTypes.node.isRequired,
        domainFilter: PropTypes.node.isRequired,
        contentFilter: PropTypes.node.isRequired,
        bookmarkFilter: PropTypes.node.isRequired,
        toggleFilterBar: PropTypes.func.isRequired,
    }

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
