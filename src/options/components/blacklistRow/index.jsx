import React, { PropTypes } from 'react'
import classNames from 'classnames'

import styles from './style.css'

const iconClasses = classNames({
    'material-icons': true,
    [styles.icon]: true
})

const BlacklistRow = ({ blacklistItem, itemId, onDeleteClicked }) => (
    <tr>
        <td colSpan={3}>
            <span>{blacklistItem.expression}</span>

            <span className={styles.blacklistActions}>
                <a onClick={() => onDeleteClicked(itemId)}><i className={iconClasses}>delete</i></a>
            </span>
        </td>
    </tr>
)

BlacklistRow.propTypes = {
    blacklistItem: PropTypes.object.isRequired,
    itemId: PropTypes.number.isRequired,
    onDeleteClicked: PropTypes.func.isRequired
}

export default BlacklistRow
