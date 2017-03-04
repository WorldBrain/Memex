import React, { PropTypes } from 'react'

import styles from './style.css'

const BlacklistNewSite = ({ isEnabled , inputName, onAdd, onCancelAdding }) => {

    function onSaveClick() {
        const el = document.querySelector(`input[data-name="${inputName}"]`)

        el.value.length && onAdd(el.value)
        el.value = ''
    }

    function handleKeyPress(e) {
        if(e.which === 13) {
            e.preventDefault()
            onSaveClick()
        }

        if(e.which === 27) {
            e.preventDefault()
            onCancelAdding()
        }
    }

    return (
        <tr>
            { isEnabled && (
                <td colSpan={3} className={styles.cell}>
                    <div className={styles.newSite}>
                        
                        <input data-name={inputName}
                               className={styles.input}
                               type="text"
                               placeholder="Enter any text, domain or regular expression"
                               onKeyUp={handleKeyPress} />

                        <button onClick={onSaveClick} className={styles.saveButton}>
                            <span className="material-icons">save</span>
                        </button>

                    </div>
                </td>
            )}
        </tr>
    )
}

BlacklistNewSite.propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    inputName: PropTypes.string.isRequired,
    onAdd: PropTypes.func.isRequired,
    onCancelAdding: PropTypes.func.isRequired
}

export default BlacklistNewSite
