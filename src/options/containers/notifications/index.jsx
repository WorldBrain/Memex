import React from 'react'

import Notifications from '../../notifications'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

const NotificationsContainer = () => (
    <div>
        <h1 className={routeTitle}>Notifications</h1>

        <section className={styles.section}>
            <h2 className={sectionTitle}>Click to mark as unread</h2>

            <Notifications />
        </section>
    </div>
)

export default NotificationsContainer
