import React from 'react'
import PropTypes from 'prop-types'

import styles from './BlacklistRow.css'

const BlacklistRow = ({ expression, onDeleteClicked }) => (
    <tr>
        <td className={styles.row} colSpan={3}>
            <div className={styles.expression}>{expression}</div>

            <div className={styles.actions}>
                <span className={styles.icon} onClick={onDeleteClicked}/>
            </div>
        </td>
    </tr>
)

BlacklistRow.propTypes = {
    // State
    expression: PropTypes.string.isRequired,

    // Event handlers
    onDeleteClicked: PropTypes.func.isRequired,
}

export default BlacklistRow
