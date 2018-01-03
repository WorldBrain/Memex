import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './LoadingIndicator.css'

const LoadingIndicator = ({ className }) => (
    <div className={classNames(styles.container, className)}>
        <span className={classNames(styles.dotone, styles.dot)} />
        <span className={classNames(styles.dottwo, styles.dot)} />
        <span className={classNames(styles.dotthree, styles.dot)} />
    </div>
)

LoadingIndicator.propTypes = { className: PropTypes.string }

export default LoadingIndicator
