import React from 'react'
import PropTypes from 'prop-types'

import Search from './Search'

import styles from './Popup.css'

const Popup = ({ children, ...searchProps }) => (
    <div className={styles.popup}>
        {!searchProps.tagSelected && <Search {...searchProps} />}
        {children}
    </div>
)

Popup.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default Popup
