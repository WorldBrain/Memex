import React from 'react'
import PropTypes from 'prop-types'

import Ribbon from './Ribbon'
import styles from './IndexDropdownSB.css'
import { IndexDropdown } from 'src/common-ui/containers'

const IndexDropdownSB = props => (
    <div className={styles.container}>
        <IndexDropdown {...props} isForSidebar />
        {props.isSidebarOpen && (
            <Ribbon
                tickBtnClick={props.onClose}
                crossBtnClick={() => {
                    const a = 'b'
                }}
            />
        )}
    </div>
)

IndexDropdownSB.propTypes = {
    isSidebarOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
}

export default IndexDropdownSB
