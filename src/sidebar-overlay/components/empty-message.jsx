import React from 'react'

import styles from './sidebar/sidebar.css'

const EmptyMessage = () => (
    <div className={styles.emptyMessage}>
        <div className={styles.emoji}> ¯\_(ツ)_/¯ </div>
        <div className={styles.text}>
            {' '}
            No comments and annotations made yet{' '}
        </div>
        <a
            target="_blank"
            href="https://worldbrain.helprace.com/i66-annotations-comments"
            className={styles.learnHow}
        >
            {' '}
            Learn How{' '}
        </a>
    </div>
)

export default EmptyMessage
