import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import styles from './IndexDropdownSB.css'
import { IndexDropdown } from 'src/common-ui/containers'

class IndexDropdownSB extends PureComponent {
    handleClickOutside = () => {
        this.props.closeDropdown()
    }

    render() {
        return (
            <div className={styles.container}>
                <IndexDropdown {...this.props} isForSidebar />
            </div>
        )
    }
}

IndexDropdownSB.propTypes = {
    isSidebarOpen: PropTypes.bool.isRequired,
    closeDropdown: PropTypes.func.isRequired,
}

// export default IndexDropdownSB
export default OnClickOutside(IndexDropdownSB)
