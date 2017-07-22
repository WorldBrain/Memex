import React, { Component } from 'react'
import db from './index-pouch.js'
import styles from './style.css'


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
                <h1> Notifications</h1>

                <section className={styles.section}>
                    <h2>Click to mark as unread</h2>

                    <h1>title {title}</h1>
                    <p>
                        <span>{title} title | </span>
                        <span>{body} body | </span>
                    </p>
                </section>
            </div>
        )
    }
}

export default NotificationsContainer
