import React from 'react'
import PropTypes from 'prop-types'

import Ribbon from './Ribbon'
import styles from './IndexDropdownSB.css'
import { IndexDropdown } from 'src/common-ui/containers'

const IndexDropdownSB = props => (
    <div className={styles.container}>
        <IndexDropdown {...props} isForSidebar />
        {props.isSidebarOpen && <Ribbon />}
    </div>
)

IndexDropdownSB.propTypes = {
    isSidebarOpen: PropTypes.bool.isRequired,
}

export default IndexDropdownSB
