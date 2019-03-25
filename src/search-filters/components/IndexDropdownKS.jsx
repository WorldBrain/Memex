import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import styles from './IndexDropdownSB.css'
import { IndexDropdown } from 'src/common-ui/containers'

class IndexDropdownKS extends PureComponent {
    handleClickOutside = () => {
        this.props.closeDropdown()
    }

    render() {
        // let countResult = 0
        // console.log(this.props)
        // countResult = this.props.initSuggestions.length;
        // this.props.checkResultCount(countResult)
        return (
            <div className={styles.container}>
                <IndexDropdown {...this.props} isForSidebar />
            </div>
        )
    }
}

IndexDropdownKS.propTypes = {
    isSidebarOpen: PropTypes.bool.isRequired,
    closeDropdown: PropTypes.func.isRequired,
    initSuggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
    // checkResultCount: PropTypes.func.isRequired,
}

// export default IndexDropdownKS
export default OnClickOutside(IndexDropdownKS)
