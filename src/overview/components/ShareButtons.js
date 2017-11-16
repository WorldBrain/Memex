import React from 'react'

import styles from './ShareButtons.css'

const ShareButtons = props => (
    <div className={styles.shareIcons}>
        <p className={styles.shareText}>Spread the love</p>{' '}
        <a target="_blank" href="https://worldbrain.io/share/facebook">
            <img className={styles.shareImg} vspace={2} src="/img/face.png" />
        </a>{' '}
        <a target="_blank" href="https://worldbrain.io/share/twitter">
            <img className={styles.shareImg} vspace={2} src="/img/twitt.png" />
        </a>{' '}
        <a target="_blank" href="https://worldbrain.io/share/reddit">
            <img className={styles.shareImg} vspace={2} src="/img/ic.png" />
        </a>{' '}
        <a target="_blank" href="https://worldbrain.io/share/email">
            <img className={styles.shareImg} vspace={2} src="/img/@.png" />
        </a>{' '}
        <a
            target="_blank"
            href="https://worldbrain.io/share/feedback"
            className={styles.fedLink}
        >
            Feedback{' '}
        </a>{' '}
    </div>
)

export default ShareButtons
