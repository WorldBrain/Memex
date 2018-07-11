import React, { Component } from 'react'

import unreadNotifications from 'src/util/unread-notifications'
import ButtonIcon from './ButtonIcon'
import styles from './Button.css'
import * as constants from '../constants'
import { remoteFunction } from '../../util/webextensionRPC'

const getUnreadCount = remoteFunction('getUnreadCount')

class NotificationContainer extends Component {
    state = {
        unreadNotifCount: 0,
    }

    async componentDidMount() {
        const updateState = newState =>
            this.setState(oldState => ({ ...oldState, ...newState }))
        const noop = f => f // Don't do anything if error; state doesn't change

        this.getInitNotificationState()
            .then(updateState)
            .catch(noop)
    }

    async getInitNotificationState() {
        const res = await getUnreadCount()
        return { unreadNotifCount: res }
    }

    render() {
        const { unreadNotifCount } = this.state

        return (
            <ButtonIcon
                href={`${constants.OVERVIEW_URL}?showInbox=true`}
                icon="notification"
                btnClass={styles.notification}
                value={unreadNotifCount}
                isNotif
            />
        )
    }
}

export default NotificationContainer
