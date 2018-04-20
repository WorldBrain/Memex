import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Button.css'

const SplitButton = ({ iconClass, children }) => (
    <div className={styles.item}>
        {iconClass && <div className={cx(styles.customIcon, iconClass)} />}
        <div className={styles.splitBtn}>{children}</div>
    </div>
)

SplitButton.propTypes = {
    iconClass: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default SplitButton
