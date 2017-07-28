import React, { Component } from 'react'
import db from './index-pouch.js'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './Notifs.css'

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = { notifs: {}, selectedNotificationId: -1 }
    }

    selectNotification(doc) {
        this.setState({selectedNotificationId: doc._id})
    }

    componentDidMount() {
        db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: 'notif',
            endkey: 'notif\ufff0',
        })
            .then(notifs => this.setState(() => ({ notifs })))
            .catch(err => console.log(err))
    }

    render() {
        const { notifs } = this.state
        return (
            <div className='recipes'>
                <h1 className={routeTitle}> Notifications</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Click to mark as unread</h2>
                    <div className={styles.tableContainer}>
                        <ul className={styles.notifs}>
                            {notifs.rows && notifs.rows.map(({ doc }) => (
                                <li onClick={() => this.selectNotification(doc)} key={doc.title}>
                                    {doc.title}
                                    {this.state.selectedNotificationId === doc._id
                                    && <li key={doc.body}>{doc.body}</li>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
