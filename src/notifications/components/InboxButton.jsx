import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './InboxButton.css'

const showInboxClass = showInbox =>
    classNames({
        [styles.inbox]: true,
        [styles.activeInbox]: showInbox,
    })

const InboxButton = props => (
    <div
        className={showInboxClass(props.showInbox)}
        onClick={props.toggleInbox}
    >
        Inbox
        {props.unreadNotifCount !== 0 && (
            <span className={styles.inboxCount}>{props.unreadNotifCount}</span>
        )}
    </div>
)

InboxButton.propTypes = {
    toggleInbox: PropTypes.func.isRequired,
    showInbox: PropTypes.bool.isRequired,
    unreadNotifCount: PropTypes.number.isRequired,
}

export default InboxButton
