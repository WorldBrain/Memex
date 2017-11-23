import React from 'react'

import styles from './ShareButtons.css'
import ShareButton from './ShareButton'

const ShareButtons = () => (
    <div className={styles.outer}>
        <div className={styles.shareIcons}>
            <p className={styles.shareText}>Spread the love</p>{' '}
            <ShareButton
                href="https://worldbrain.io/share/facebook"
                imgSrc="/img/face.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/twitter"
                imgSrc="/img/twitt.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/reddit"
                imgSrc="/img/ic.png"
            />
            <ShareButton
                href="https://worldbrain.io/share/email"
                imgSrc="/img/@.png"
            />
            <ShareButton
                className={styles.fedLink}
                href="https://worldbrain.io/share/feedback"
            >
                Feedback
            </ShareButton>
        </div>
    </div>
)

export default ShareButtons
