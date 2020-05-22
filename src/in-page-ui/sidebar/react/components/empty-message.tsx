import React from 'react'

const styles = require('./empty-message.css')

/* tslint:disable-next-line variable-name */
const EmptyMessage = () => (
    <div className={styles.emptyMessage}>
        <div className={styles.emoji}> ¯\_(ツ)_/¯ </div>
        <div className={styles.text}> No notes or highlights on this page </div>
    </div>
)

export default EmptyMessage
