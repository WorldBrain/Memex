import React, { PropTypes } from 'react'
import classNames from 'classnames'

import styles from './BlacklistRow.css'
import { blacklistButton } from './base.css'

const iconClasses = classNames({
    'material-icons': true,
    [styles.icon]: true,
})

const BlacklistRow = ({ blacklistItem, itemId, onDeleteClicked }) => (
    <tr>
        <td colSpan={3}>
            <span>{blacklistItem.expression}</span>

            <span className={styles.blacklistActions}>
                <button className={blacklistButton} onClick={() => onDeleteClicked(itemId)}>
                    <i className={iconClasses}>delete</i>
                </button>
            </span>
        </td>
    </tr>
)

BlacklistRow.propTypes = {
    blacklistItem: PropTypes.object.isRequired,
    itemId: PropTypes.number.isRequired,
    onDeleteClicked: PropTypes.func.isRequired,
}

export default BlacklistRow
