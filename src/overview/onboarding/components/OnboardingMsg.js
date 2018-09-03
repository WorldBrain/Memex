import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Onboarding.css'

const OnboardingMsg = ({ onFinish }) => (
    <div className={styles.messageContainer}>
        <div className={styles.heading}>Welcome to your memex</div>
        <div className={styles.subheading}>Explore its key features</div>
        <div className={styles.or}>OR</div>
        <a
            className={cx(styles.choiceBtn, styles.startBtn)}
            type="button"
            onClick={onFinish}
        >
            <div className={styles.getStatedBtn}> GET STARTED </div>
            <div className={styles.letsGoBtn}> LET'S GOOO! </div>
        </a>
    </div>
)

OnboardingMsg.propTypes = {
    onFinish: PropTypes.func.isRequired,
}

export default OnboardingMsg
