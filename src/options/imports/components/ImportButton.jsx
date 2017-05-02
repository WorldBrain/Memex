import React, { PropTypes } from 'react'
import classNames from 'classnames'
import styles from '../../options.css'
import localStyles from './ImportButton.css'

const ImportButton = ({ children, handleClick, isDisabled }) => (
    <button
        className={classNames(localStyles.actionButton, styles.button)}
        onClick={handleClick}
        disabled={isDisabled}
    >
        {children}
    </button>
)

ImportButton.propTypes = {
    children: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
}

export default ImportButton

