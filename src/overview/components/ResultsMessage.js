import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Overview.css'

const ResultsMessage = ({ children, small = false }) => (
    <div className={cx(styles.resultMessage, { [styles.smallMessage]: small })}>
        {children}
    </div>
)

ResultsMessage.propTypes = {
    small: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        .isRequired,
}

export default ResultsMessage
