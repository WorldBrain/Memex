import React, { Component } from 'react'
import db from '../../../../src/pouchdb'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './Notifs.css'
import setUnreadCount from '../../../util/setUnreadCount'
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'
const CSSTransitionGroup = require('react-transition-group/CSSTransitionGroup')


fetchNewNotifs()
setInterval(fetchNewNotifs, 1000 * 60 * 60) 

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = {
            notifs: {},
            selectedNotificationId: -1,
            className: '',
        }
    }

    setStateFromPouch() {
        db
            .allDocs({
                include_docs: true,
                attachments: true,
                startkey: 'notif',
                endkey: 'notif\ufff0',
            })
            .then(notifs => this.setState(state => ({ ...state, notifs })))
            .catch(err => console.log(err))
    }

    async selectNotification(doc) {
        try {
            console.log()
            this.setState({
            selectedNotificationId: doc._id,
            className: 'viewed',
            })
            db.put({
                ...doc,
                viewed: true,
            })
            console.log('one')
            setUnreadCount()
            updateWBBadge()
        } catch (err) {
            console.err('err', err)
        }
    }

    componentDidMount() {
        db.changes({
            live: true,
            include_docs: true,
        }).on('change', function(c) {
        })
        this.setStateFromPouch()
    }

    render() {
        const { notifs } = this.state
        return (
            <div>
                <h1 className={routeTitle}> Notifications</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Click to mark as unread</h2>
                    <div className={styles.tableContainer}>
                        <ul className={styles.notifs}>
                            {notifs.rows
                                && notifs.rows.map(({ doc }) =>
                                    <li
                                        onClick={() =>
                                            this.selectNotification(doc)}
                                        className={
                                            doc.viewed ? styles.viewed : styles.notviewed
                                        }
                                        key={doc._id}>
                                        {doc.title}
                                        {this.state.selectedNotificationId
                                        === doc._id
                                        &&<CSSTransitionGroup
                                            transitionName={styles.toggle}
                                            transitionEnterTimeout={500}
                                            transitionLeaveTimeout={300}> <li key={doc._id}>{doc.body}</li>
                                        </CSSTransitionGroup>}
                                    </li>
                                )}
                        </ul>
                    </div>
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
