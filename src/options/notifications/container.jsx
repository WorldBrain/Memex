import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { remoteFunction } from 'src/util/webextensionRPC'
import db from 'src/search/search-index-new'
import styles from './Notifs.css'
import setUnreadCount from '../../util/setUnreadCount'
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'
import UnreadMessages from './components/UnreadMessages'
import MessageRow from './components/messageRow'
import * as actions from './actions'
import * as selectors from './selectors'

import { connect } from 'react-redux'

const addNotification = remoteFunction('addNotification')

fetchNewNotifs()
setInterval(fetchNewNotifs, 1000 * 60)

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            notifs: [],
            selectedNotificationId: -1,
            showAll: false,
            unreadMessagesCount: 0,
        }

        this.setShowAll = this.setShowAll.bind(this)
        this.setMarkAllRead = this.setMarkAllRead.bind(this)
    }

    componentDidMount() {
        this.setStateFromPouch()
        this.props.handleReadNotification()
    }

    selectNotification = doc => async () => {
        try {
            this.setState({
                selectedNotificationId:
                    this.state.selectedNotificationId === doc.id ? '' : doc.id,
            })

            await addNotification({
                ...doc,
                viewed: true,
            })

            // setUnreadCount(s)
            updateWBBadge()
            this.props.handleReadNotification()
        } catch (err) {
            console.log('err', err)
        }
    }

    setShowAll() {
        this.setState({
            showAll: true,
        })
    }

    async setMarkAllRead() {
        const unreadMessages = this.state.notifs.filter(
            notif => notif.viewed === false,
        )

        for (let i = 0; i < unreadMessages.length; i++) {
            await addNotification({
                ...unreadMessages[i],
                viewed: true,
            })
        }

        this.setStateFromPouch()
        setUnreadCount()
        updateWBBadge()
        this.props.handleReadNotification()
    }

    setStateFromPouch() {
        db.notifications
            .toArray()
            .then(notifs => this.setState(state => ({ ...state, notifs })))
            .catch(err => console.log(err))
    }

    renderMessageDetailsRows = (readMessages, isRead = true) => {
        if (this.state.showAll && isRead) {
            return [
                readMessages
                    .reverse()
                    .map((notif, i) => (
                        <MessageRow
                            key={i}
                            isOpen={
                                this.state.selectedNotificationId === notif.id
                            }
                            doc={notif}
                            handleClick={this.selectNotification(notif)}
                        />
                    )),
            ]
        } else {
            return [
                readMessages
                    .slice(-5)
                    .reverse()
                    .map((notif, i) => (
                        <MessageRow
                            key={i}
                            isOpen={
                                this.state.selectedNotificationId === notif.id
                            }
                            doc={notif}
                            handleClick={this.selectNotification(notif)}
                        />
                    )),
            ]
        }
    }

    renderMesaagesTable = readMessages => (
        <UnreadMessages>
            {this.renderMessageDetailsRows(readMessages, false)}
        </UnreadMessages>
    )

    render() {
        const { notifs } = this.state
        const unreadMessages = notifs.length
            ? notifs.filter(notif => notif.viewed === false)
            : []
        const readMessages = notifs.length
            ? notifs.filter(notif => notif.viewed === true)
            : []

        return (
            <div className={styles.notifbackground}>
                <section className={styles.section}>
                    <div className={styles.unreadMessage}>
                        New Messages ({unreadMessages.length})
                    </div>
                    <div
                        className={styles.markallread}
                        onClick={this.setMarkAllRead}
                    >
                        Mark all as "read"
                    </div>
                    <br />
                    {!unreadMessages.length && (
                        <div className={styles.noMessage}>
                            You have no new notification
                        </div>
                    )}
                    {this.renderMesaagesTable(unreadMessages)}
                </section>
                <section className={styles.sectionReadMessages}>
                    <div className={styles.unreadMessage}>
                        Archived Messages ({readMessages.length})
                    </div>
                    <div
                        className={styles.markallread}
                        onClick={this.setShowAll}
                    >
                        Show all
                    </div>
                    <br />
                    {!readMessages.length && (
                        <div className={styles.noMessage}>
                            No past notifications.
                        </div>
                    )}
                    {this.renderMesaagesTable(readMessages)}
                </section>
            </div>
        )
    }
}

NotificationsContainer.propTypes = {
    unreadMessagesCount: PropTypes.number.isRequired,
    handleReadNotification: PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
    unreadMessagesCount: selectors.unreadMessagesCount(state),
})

const mapDispatchToProps = dispatch => ({
    handleReadNotification: () => dispatch(actions.unreadMessagesUpdate()),
})

export default connect(mapStateToProps, mapDispatchToProps)(
    NotificationsContainer,
)
