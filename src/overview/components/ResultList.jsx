import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ResultList.css'

// Calculate height of the list to prevent scrolling
// Height = 90vh + amount of height scrolled
const calcHeight = scrollDisabled => {
    if (!scrollDisabled) return {}
    return {
        height: 0.9 * window.innerHeight + window.pageYOffset + 20,
    }
}

const ResultList = ({ children, scrollDisabled = false }) => (
    <ul
        style={calcHeight(scrollDisabled)}
        className={cx(styles.root, { [styles.noScroll]: scrollDisabled })}
    >
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
