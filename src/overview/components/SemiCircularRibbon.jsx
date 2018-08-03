import React from 'react'
import styles from './SemiCircularRibbon.css'
import PropTypes from 'prop-types'

const SemiCircularRibbon = ({ children, title = null }) => (
    <div title={title} className={styles.ribbon}>
        {children}
    </div>
)

SemiCircularRibbon.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
}

export default SemiCircularRibbon
