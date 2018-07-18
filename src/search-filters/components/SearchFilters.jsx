import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import styles from './SearchFilters.css'

class SearchFilters extends PureComponent {
    static propTypes = {
        tagFilter: PropTypes.node.isRequired,
        domainFilter: PropTypes.node.isRequired,
        filteredTags: PropTypes.node,
        filteredDomains: PropTypes.node,
        bookmarkFilter: PropTypes.node.isRequired,
        typeFilters: PropTypes.node.isRequired,
        filteredTypes: PropTypes.node,
    }

    render() {
        return (
            <div>
                {this.props.tagFilter}
                <div className={styles.filtered}>{this.props.filteredTags}</div>
                {this.props.domainFilter}
                <div className={styles.filtered}>
                    {this.props.filteredDomains}
                </div>
                {this.props.typeFilters}
                <div className={styles.filtered}>
                    {this.props.filteredTypes}
                </div>
                <div className={styles.otherFilters}>
                    <span className={styles.others}>Others</span>
                    {this.props.bookmarkFilter}
                </div>
            </div>
        )
    }
}

export default SearchFilters
