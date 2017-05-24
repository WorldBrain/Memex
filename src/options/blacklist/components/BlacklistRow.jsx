import React, { PropTypes } from 'react'
import classNames from 'classnames'

import styles from './BlacklistRow.css'
import { blacklistButton } from './base.css'

const iconClasses = classNames({
    'material-icons': true,
    [styles.icon]: true,
})

const BlacklistRow = ({ expression, onDeleteClicked }) => (
    <tr>
        <td colSpan={3}>
            <span>{expression}</span>

            <span className={styles.blacklistActions}>
                <button className={blacklistButton} onClick={onDeleteClicked}>
                    <i className={iconClasses}>delete</i>
                </button>
            </span>
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
