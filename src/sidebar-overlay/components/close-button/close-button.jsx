import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './close-button.css'

const CloseButton = ({ isActive, isOverview = false, clickHandler, title }) => (
    <div
        className={cx(styles.close, {
            [styles.hidden]: !isActive,
            [styles.overview]: isOverview,
        })}
        onClick={clickHandler}
        title={title}
    >
        <span className={styles.closeIcon} />
    </div>
)

CloseButton.propTypes = {
    isActive: PropTypes.bool.isRequired,
    isOverview: PropTypes.bool,
    clickHandler: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
}

export default CloseButton
