import React, { Component } from "react"
import db from "./index-pouch.js"
import { routeTitle, sectionTitle } from "../../base.css"
import styles from "./Notifs.css"
import setUnreadCount from "../../../util/setUnreadCount.js"

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = { notifs: {}, selectedNotificationId: -1 }
    }

    selectNotification(doc) {
        this.setState({ selectedNotificationId: doc._id })
        db
            .get(doc._id)
            .then(function(doc) {
                return db.put({
                    _id: doc._id,
                    _rev: doc._rev,
                    title: doc.title,
                    body: doc.body,
                    viewed: true,
                })
            })
            .then(function(response) {
                setUnreadCount(0).then(function(res) {
                    // Write the code which depends on the `res.val`, here
                    var ba = chrome.browserAction
                    ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
                    ba.setBadgeText({ text: "" + res })
                    console.log("what are you baby?", res)
                })
                    .catch(function(err) {
                        console.log("err")
                    })
            })
            .catch(function(err) {
                console.log("err")
            })
    }

    componentDidMount() {
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
                                        className={
                                            doc.viewed ? 'viewed' : 'not-viewed'
                                        }
                                        onClick={() =>
                                            this.selectNotification(doc)}
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
