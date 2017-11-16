import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Overview.css'

const ResultsMessage = ({ children, small = false }) => (
    <p className={cx(styles.resultMessage, { [styles.smallMessage]: small })}>
        {children}
    </p>
)

ResultsMessage.propTypes = {
    small: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        .isRequired,
}

export default ResultsMessage
