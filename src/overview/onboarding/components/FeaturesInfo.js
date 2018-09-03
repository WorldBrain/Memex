import React from 'react'
import PropTypes from 'prop-types'

import styles from './Onboarding.css'

const FeaturesInfo = ({ children, optInManager }) => (
    <div className={styles.rightContainer}>
        <div className={styles.featureContainer}>{children}</div>
        <div className={styles.optInContainer}>{optInManager}</div>
    </div>
)

FeaturesInfo.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    optInManager: PropTypes.node,
}

export default FeaturesInfo
