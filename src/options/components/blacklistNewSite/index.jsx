import React, { PropTypes } from 'react'

import styles from './style.css'
import { blacklistButton } from '../../base.css'

const BlacklistNewSite = ({ value, onAdd, handleKeyPress, onInputChange, onInputClear, inputRef }) => (
    <tr>
        <td colSpan={3} className={styles.cell}>
            <div className={styles.newSiteInputRow}>

                <input value={value}
                        className={styles.input}
                        type="text"
                        placeholder="Enter any text or domain or path to ignore matching URLs"
                        onChange={onInputChange}
                        onKeyUp={handleKeyPress}
                        ref={inputRef} />

                <div className={styles.inputButtons}>
                    <button onClick={onInputClear} className={blacklistButton} disabled={value.length === 0}>
                        <i className="material-icons">backspace</i>
                    </button>

                    <button onClick={onAdd} className={blacklistButton} disabled={!/\S/g.test(value)}>
                        <i className="material-icons">save</i>
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
