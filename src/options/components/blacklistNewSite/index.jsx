import React, { PropTypes } from 'react'

import styles from './style.css'

const BlacklistNewSite = ({ value, onAdd, handleKeyPress, onInputChange }) => (
    <tr>
        <td colSpan={3} className={styles.cell}>
            <div className={styles.newSite}>

                <input ref={input => input && input.focus()}
                        value={value}
                        className={styles.input}
                        type="text"
                        placeholder="Enter any text, domain or regular expression"
                        onChange={onInputChange}
                        onKeyUp={handleKeyPress} />

                <button onClick={onAdd} className={styles.saveButton}>
                    <span className="material-icons">save</span>
                </button>

            </div>
        </td>
    </tr>
)

BlacklistNewSite.propTypes = {
    value: PropTypes.string.isRequired,
    onAdd: PropTypes.func.isRequired,
    handleKeyPress: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
}

export default BlacklistNewSite
