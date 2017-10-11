import React from 'react'
import PropTypes from 'prop-types'

import styles from './BlacklistInputRow.css'

const BlacklistInputRow = ({
    value,
    isClearBtnDisabled,
    isSaveBtnDisabled,
    onAdd,
    handleKeyPress,
    onInputChange,
    onInputClear,
    inputRef,
}) => (
    <div className={styles.newSiteInputRow}>
        <input
            value={value}
            className={styles.input}
            type="text"
            placeholder="Enter any text or domain or path to ignore matching URLs"
            onChange={onInputChange}
            onKeyUp={handleKeyPress}
            ref={inputRef}
        />

        <div className={styles.inputButtons}>
            {/* <button onClick={onInputClear} className={blacklistButton} disabled={isClearBtnDisabled}>
                            <i className='material-icons'>backspace</i>
                        </button> */}

            <button
                onClick={onAdd}
                className={styles.blacklistButton}
                disabled={isSaveBtnDisabled}
            >
                {/* <i className='material-icons'>save</i> */}
                ADD TO BLACKLIST
            </button>
        </div>
    </div>
)

export const propTypes = (BlacklistInputRow.propTypes = {
    // State
    value: PropTypes.string.isRequired,
    isClearBtnDisabled: PropTypes.bool.isRequired,
    isSaveBtnDisabled: PropTypes.bool.isRequired,

    // Event handlers
    onAdd: PropTypes.func.isRequired,
    handleKeyPress: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onInputClear: PropTypes.func.isRequired,

    // Misc
    inputRef: PropTypes.func.isRequired,
})

export default BlacklistInputRow
