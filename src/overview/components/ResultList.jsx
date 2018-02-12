import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ResultList.css'

const ResultList = ({ children, scrollDisabled = false }) => (
    <ul className={cx(styles.root, { [styles.noScroll]: scrollDisabled })}>
        {children}
    </ul>
)

ResultList.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    scrollDisabled: PropTypes.bool,
}

export default ResultList
