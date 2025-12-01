import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const InboxButton = (props) => (
    <div onClick={props.toggleInbox}>
        {props.showUnreadCount && <span>{props.unreadNotifCount}</span>}
    </div>
)

InboxButton.propTypes = {
    toggleInbox: PropTypes.func.isRequired,
    showInbox: PropTypes.bool.isRequired,
    unreadNotifCount: PropTypes.number.isRequired,
    showUnreadCount: PropTypes.bool.isRequired,
}

export default InboxButton
