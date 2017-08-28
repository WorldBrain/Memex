import React, { Component } from "react"
import db from "../../../../src/pouchdb"
import { routeTitle, sectionTitle } from "../../base.css"
import styles from "./Notifs.css"
import setUnreadCount from "../../../util/setUnreadCount"
import fetchNewNotifs from './polling/fetchNewNotifs'
import updateWBBadge from './updateWBBadge'

fetchNewNotifs()
setInterval(fetchNewNotifs, 1000 * 60 * 60) 

console.log("test");
var test = setUnreadCount(0).then(console.log)


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

    selectNotification(doc) {
        try {
            console.log("0000")
            this.setState({
            selectedNotificationId: doc._id,
            })
            
            let notif = db.get(doc._id)
            db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    title: doc.title,
                    body: doc.body,
                    viewed: true,
            })
            this.setStateFromPouch()
            console.log("1111")
            setUnreadCount(0)
            updateWBBadge(0)
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
