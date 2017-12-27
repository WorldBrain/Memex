import React, { Component } from 'react'
import PropTypes from 'prop-types'

import db from '../../../src/pouchdb'
import styles from './Notifs.css'
import setUnreadCount from '../../util/setUnreadCount'
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'
import UnreadMessages from './components/UnreadMessages'
import MessageRow from './components/messageRow'
import * as actions from './actions'
import * as selectors from './selectors'

import { connect } from 'react-redux'

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
            unreadMessagesCount: 0,
        }
        console.log(this.props.unreadMessagesCount)
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
        this.props.handleReadNotification()
    }

    selectNotification = doc => () => {
        try {
            this.setState({
                selectedNotificationId:
                    this.state.selectedNotificationId === doc._id
                        ? ''
                        : doc._id,
            })

            if (!doc.viewed) {
                db.put({
                    ...doc,
                    viewed: true,
                })
            }
            setUnreadCount()
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
        setUnreadCount()
        updateWBBadge()
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
        console.log(this.props)
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
                    <br />
                    {!readMessages.length && (
                        <div className={styles.noMessage}>
                            There is no archive notification.
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
