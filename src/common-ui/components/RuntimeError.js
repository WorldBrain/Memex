import React from 'react'
import styles from './RuntimeError.css'

// TODO: Improve this; will be shown whenever an uncaught runtime error happens
const RuntimeError = () => (
    <div className={styles.main}>
        An unexpected error has happened. Please reload the extension page.
    </div>
)

export default RuntimeError
