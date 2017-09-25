import React, { Component } from 'react'
import db from '../../../../src/pouchdb'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './Notifs.css'
import setUnreadCount from '../../../util/setUnreadCount'
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'


fetchNewNotifs()
setInterval(fetchNewNotifs, 1000 * 60)

console.log("ok?1")

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
                startkey: 'notifs',
                endkey: 'notifs\ufff0',
            })
            .then(notifs => this.setState(state => ({ ...state, notifs })))
            .catch(err => console.log(err))
    }

    async selectNotification(doc) {
        try {
            this.setState({
            selectedNotificationId: doc._id,
            className: 'viewed',
            })
            db.put({
                ...doc,
                viewed: true,
            })
            this.setStateFromPouch()
            setUnreadCount()
            updateWBBadge()
        } catch (err) {
            console.log('err', err)
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
                                && notifs.rows.reverse().map(({ doc }) =>
                                    <li
                                        onClick={() =>
                                            this.selectNotification(doc)}
                                        className={
                                            doc.viewed ? styles.viewed : styles.notviewed
                                        }
                                        key={doc.date}>
                                        {doc.title}
                                        {this.state.selectedNotificationId
                                        === doc._id
                                        && <li className={styles.toggle} key={doc.title}>{doc.body} | {doc.date}</li>}
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
