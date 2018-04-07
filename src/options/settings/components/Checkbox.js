import React from 'react'
import PropTypes from 'prop-types'

import styles from './Checkbox.css'

const Checkbox = ({ children, name, id, handleChange, isChecked }) => {
    handleChange = handleChange.bind(null, name)
    return (
        <div>
            <input
                className={styles.checkbox}
                type="checkbox"
                name={name}
                id={id}
                checked={isChecked}
                onChange={handleChange}
            />
            <label className={styles.label} onClick={handleChange}>
                <span className={styles.checkboxText}>{children}</span>
            </label>
        </div>
    )
}

Checkbox.propTypes = {
    name: PropTypes.string,
    id: PropTypes.string,
    handleChange: PropTypes.func.isRequired,
    isChecked: PropTypes.bool.isRequired,
    children: PropTypes.string.isRequired,
}

export default Checkbox
