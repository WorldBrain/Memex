import React from 'react'
import styles from './Sidebar.css'

const EmptyMessage = () => (
    <div className={styles.emptyMessage}>
        <div className={styles.emoji}> ¯\_(ツ)_/¯ </div>
        <div className={styles.text}>
            {' '}
            No comments and annotations made yet{' '}
        </div>
        <a className={styles.learnHow}> Learn How </a>
    </div>
)

export default EmptyMessage
