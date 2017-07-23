import React, { Component } from 'react'
import db from './index-pouch.js'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './BlacklistTable.css'

class NotificationsContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            doc: {
                _id: '',
                title: '',
                body: '',
                viewed: false,
            },
        }
    }

    componentDidMount() {
        db.get('notif_1')
            .then(doc => this.setState(() => ({ doc })))
            .catch(err => console.log(err))
    }

    render() {
        const {title, body} = this.state.doc
        return (
            <div className='recipes'>
                <h1 className={routeTitle}> Notifications</h1>

                <section className={styles.section}>
                    <h2 className={sectionTitle}>Click to mark as unread</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.domainCell}> <span>{title}  | </span>{body}</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
