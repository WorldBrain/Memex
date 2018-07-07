import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

// import styles from './BookmarkFilter'

class SearchFilters extends PureComponent {
    static propTypes = {
        tagFilter: PropTypes.node.isRequired,
        domainFilter: PropTypes.node.isRequired,
        filteredTags: PropTypes.node,
        filteredDomains: PropTypes.node,
    }

    render() {
        return (
            <div>
                {this.props.tagFilter}
                {this.props.filteredTags}
                {this.props.domainFilter}
                {this.props.filteredDomains}
            </div>
        )
    }
}

export default SearchFilters
