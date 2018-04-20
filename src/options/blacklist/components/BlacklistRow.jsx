import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './BlacklistRow.css'
import { blacklistButton } from './base.css'

const iconClasses = classNames({
    'material-icons': true,
    [styles.icon]: true,
})

const BlacklistRow = ({ expression, onDeleteClicked }) => (
    <tr>
        <td className={styles.row} colSpan={3}>
            <div className={styles.expression}>{expression}</div>

            <div className={styles.actions}>
                <button className={blacklistButton} onClick={onDeleteClicked}>
                    <i className={iconClasses}>remove_circle_outline</i>
                </button>
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
