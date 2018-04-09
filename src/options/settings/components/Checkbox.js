import React from 'react'
import PropTypes from 'prop-types'

import styles from './Checkbox.css'

const Checkbox = ({ children, handleChange, isChecked }) => (
    <div>
        <input
            className={styles.checkbox}
            type="checkbox"
            checked={isChecked}
            onChange={handleChange}
        />
        <label className={styles.label} onClick={handleChange}>
            <span className={styles.checkboxText}>{children}</span>
        </label>
    </div>
)

Checkbox.propTypes = {
    handleChange: PropTypes.func.isRequired,
    isChecked: PropTypes.bool.isRequired,
    children: PropTypes.string.isRequired,
}

export default Checkbox
