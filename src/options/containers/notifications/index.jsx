import React, { Component } from "react"
import db from "./index-pouch"
import { routeTitle, sectionTitle } from "../../base.css"
import styles from "./Notifs.css"
import setUnreadCount from "../../../util/setUnreadCount"
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'

fetchNewNotifs()
setTimeout(fetchNewNotifs, 10)

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
                startkey: "notif",
                endkey: "notif\ufff0",
            })
            .then(notifs => this.setState(() => ({ notifs })))
            .catch(err => console.log(err))
    }

    async selectNotification(doc) {
        try {
            this.setState({
            selectedNotificationId: doc._id,
            })
            
            let notif = await db.get(doc._id)
            db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    title: doc.title,
                    body: doc.body,
                    viewed: true,
            })
            
            this.setStateFromPouch()
            await setUnreadCount(0)
            await updateWBBadge(0)
        } catch (err) {
            console.err("err", err)
        }
    }

    componentDidMount() {
        db.changes({
            live: true,
            include_docs: true,
        }).on('change', function(c) {
            // console.log("change!", c)
        })
        this.setStateFromPouch()
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
                            {notifs.rows
                                && notifs.rows.map(({ doc }) =>
                                    <li
                                        onClick={() =>
                                            this.selectNotification(doc)}
                                        className={
                                            doc.viewed ? styles.viewed : styles.notviewed
                                        }
                                        key={doc.title}>
                                        {doc.title}
                                        {this.state.selectedNotificationId
                                        === doc._id
                                        &&<li key={doc.body}>{doc.body}</li>}
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
