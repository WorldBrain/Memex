import React from 'react'

import Ribbon from './Ribbon'
import styles from './IndexDropdownSB.css'
import { IndexDropdown } from 'src/common-ui/containers'

const IndexDropdownSB = props => (
    <div className={styles.container}>
        <IndexDropdown {...props} isForSidebar />
        <Ribbon />
    </div>
)

export default IndexDropdownSB
