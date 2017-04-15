import React, { PropTypes } from 'react'

import styles from './style.css'

const BlacklistNewSite = ({ value, onAdd, handleKeyPress, onInputChange, onInputClear, inputRef }) => (
    <tr>
        <td colSpan={3} className={styles.cell}>
            <div className={styles.newSiteInputRow}>

                <input value={value}
                        className={styles.input}
                        type="text"
                        placeholder="Enter any text, domain or regular expression"
                        onChange={onInputChange}
                        onKeyUp={handleKeyPress}
                        ref={inputRef} />

                <div className={styles.inputButtons}>
                    <button onClick={onInputClear} className={styles.button}>
                        <span className="material-icons">backspace</span>
                    </button>

                    <button onClick={onAdd} className={styles.button}>
                        <span className="material-icons">save</span>
                    </button>
                </div>

            </div>
        </td>
    </tr>
)

BlacklistNewSite.propTypes = {
    value: PropTypes.string.isRequired,
    onAdd: PropTypes.func.isRequired,
    onInputClear: PropTypes.func.isRequired,
    handleKeyPress: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
    inputRef: PropTypes.func.isRequired,
}

export default BlacklistNewSite
