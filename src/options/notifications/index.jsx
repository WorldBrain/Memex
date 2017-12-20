import React, { Component } from 'react'
import db from '../../../src/pouchdb'
import styles from './Notifs.css'
import setUnreadCount from '../../util/setUnreadCount'
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'
import UnreadMessages from './components/UnreadMessages'
import MessageRow from './components/messageRow'

fetchNewNotifs()
setInterval(fetchNewNotifs, 1000 * 60)

console.log('ok?1')

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            notifs: {},
            selectedNotificationId: -1,
            showAll: false,
        }
        this.setShowAll = this.setShowAll.bind(this)
        this.setMarkAllRead = this.setMarkAllRead.bind(this)
    }

    componentDidMount() {
        db
            .changes({
                live: true,
                include_docs: true,
            })
            .on('change', function(c) {})
        this.setStateFromPouch()
    }

    selectNotification = doc => () => {
        try {
            this.setState({
                selectedNotificationId:
                    this.state.selectedNotificationId === doc._id
                        ? ''
                        : doc._id,
            })
            db.put({
                ...doc,
                viewed: true,
            })
            setUnreadCount()
            updateWBBadge()
        } catch (err) {
            console.log('err', err)
        }
    }

    setShowAll() {
        this.setState({
            showAll: true,
        })
    }

    setMarkAllRead() {
        const unreadMessages = this.state.notifs.rows.filter(
            notif => notif.doc.viewed === false,
        )
        unreadMessages.map((notif, i) =>
            db.put({
                ...notif.doc,
                viewed: true,
            }),
        )
        this.setStateFromPouch()
    }

    setStateFromPouch() {
        db
            .allDocs({
                include_docs: true,
                attachments: true,
                startkey: 'notifs',
                endkey: 'notifs\ufff0',
            })
            .then(notifs => this.setState(state => ({ ...state, notifs })))
            .catch(err => console.log(err))
    }

    renderMessageDetailsRows = readMessages => {
        if (this.state.showAll) {
            return [
                readMessages
                    .reverse()
                    .map((notif, i) => (
                        <MessageRow
                            key={i}
                            isOpen={
                                this.state.selectedNotificationId ===
                                notif.doc._id
                            }
                            doc={notif.doc}
                            handleClick={this.selectNotification(notif.doc)}
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
                                this.state.selectedNotificationId ===
                                notif.doc._id
                            }
                            doc={notif.doc}
                            handleClick={this.selectNotification(notif.doc)}
                        />
                    )),
            ]
        }
    }

    renderMesaagesTable = readMessages => (
        <UnreadMessages>
            {this.renderMessageDetailsRows(readMessages)}
        </UnreadMessages>
    )

    render() {
        const { notifs } = this.state
        const unreadMessages = notifs.rows
            ? notifs.rows.filter(notif => notif.doc.viewed === false)
            : []
        const readMessages = notifs.rows
            ? notifs.rows.filter(notif => notif.doc.viewed === true)
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
                            There is no new notification.
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
                    {this.renderMesaagesTable(readMessages)}
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
