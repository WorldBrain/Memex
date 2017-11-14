import React, { Component } from 'react'
import styles from './ShareButtons.css'

class ShareButtons extends Component {
    render() {
        return (
            <div className={styles.shareIcons}>
                <p className={styles.shareText}> Spread the love </p>{' '}
                <a href="#">
                    <img
                        width={25}
                        height={25}
                        vspace={2}
                        src="/img/face.png"
                    />
                </a>{' '}
                <a href="#">
                    <img
                        width={25}
                        height={25}
                        vspace={2}
                        src="/img/twitt.png"
                    />
                </a>{' '}
                <a href="#">
                    <img width={25} height={25} vspace={2} src="/img/@.png" />
                </a>{' '}
                <a href="#">
                    <img width={25} height={25} vspace={2} src="/img/ic.png" />
                </a>{' '}
                <div id={styles.fedIcon}>
                    <a href="#" className={styles.FedLink}>
                        Feedback{' '}
                    </a>{' '}
                </div>{' '}
            </div>
        )
    }
}

export default ShareButtons
