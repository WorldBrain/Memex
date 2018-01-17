import React from 'react'
import PropTypes from 'prop-types'

import Search from './Search'

import styles from './Popup.css'

const Popup = ({ children, shouldRenderSearch = true, ...searchProps }) => (
    <div className={styles.popup}>
        {shouldRenderSearch && <Search {...searchProps} />}
        {children}
    </div>
)

Popup.propTypes = {
    children: PropTypes.object.isRequired,
    shouldRenderSearch: PropTypes.bool,
}

export default Popup
