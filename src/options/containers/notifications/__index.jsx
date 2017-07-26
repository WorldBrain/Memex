import React, { Component } from 'react'
import db from './index-pouch.js'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './BlacklistTable.css'


class NotificationsContainer extends Component {
    constructor(props) {
        super(props)
        this.state = { notifs: {} }
    }

    componentDidMount() {
        db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: 'notif',
            endkey: 'notif\ufff0',
        }).then(notifs => this.setState(() => ({notifs}))).catch(err => console.log(err))
    }

    render() {
        const { notifs } = this.state
        return (
            <div className='recipes'>
                <h1 className={routeTitle}> Notifications</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Click to mark as unread</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <th className={styles.domainCell}>
                                {notifs.rows && notifs.rows.map(({ doc }) => (
                                    <li key={doc} ><span>{doc.title}|</span> {doc.body}</li>
                                ))}
                            </th>
                        </table>
                    </div>
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
