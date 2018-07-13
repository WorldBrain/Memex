import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './CloseButton.css'

const CloseButton = ({ isActive, isOverview, clickHandler }) => (
    <div
        className={cx({
            [styles.close]: isActive,
            [styles.overview]: isOverview,
            [styles.hidden]: !isActive,
        })}
        onClick={clickHandler}
    >
        X
    </div>
)

CloseButton.propTypes = {
    isActive: PropTypes.bool.isRequired,
    isOverview: PropTypes.bool.isRequired,
    clickHandler: PropTypes.func.isRequired,
}

export default CloseButton
