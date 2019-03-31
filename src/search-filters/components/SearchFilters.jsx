import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import styles from './SearchFilters.css'

class SearchFilters extends PureComponent {
    static propTypes = {
        tagFilter: PropTypes.node.isRequired,
        dateFilter: PropTypes.node.isRequired,
        domainFilter: PropTypes.node.isRequired,
        contentFilter: PropTypes.node.isRequired,
        // filteredTags: PropTypes.node,
        filteredTypes: PropTypes.node,
        filteredDomains: PropTypes.node,
        bookmarkFilter: PropTypes.node.isRequired,
    }

    render() {
        return (
            <div>
                <div className={styles.bookmarksFilter}>
                    {this.props.bookmarkFilter}
                </div>
                {this.props.dateFilter}
                {this.props.tagFilter}
                {/* this.props.filteredTags && (
                    <div className={styles.filtered}>
                        {this.props.filteredTags}
                    </div>
                ) */}
                {this.props.domainFilter}
                {this.props.filteredDomains && (
                    <div className={styles.filtered}>
                        {this.props.filteredDomains}
                    </div>
                )}
                {this.props.contentFilter}
                <div className={styles.filtered}>
                    {this.props.filteredTypes}
                </div>
            </div>
        )
    }
}

export default SearchFilters
