import React from 'react'
import PropTypes from 'prop-types'

import styles from './Onboarding.css'

const FeatureInfo = ({ heading, subheading, handleClick }) => (
    <div className={styles.infoContainer}>
        <a onClick={handleClick} className={styles.featureLink}>
            <div className={styles.headingSubheading}>
                <div className={styles.featureHeading}>{heading}</div>
                <div className={styles.featureSubheading}>{subheading}</div>
            </div>
            <div className={styles.arrow}>
                <img src="/img/arrow.svg" />
            </div>
        </a>
    </div>
)

FeatureInfo.propTypes = {
    heading: PropTypes.string.isRequired,
    subheading: PropTypes.string.isRequired,
    handleClick: PropTypes.func,
}

export default FeatureInfo
