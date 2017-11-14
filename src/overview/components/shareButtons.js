import React, { Component } from 'react'
import styles from './ShareIcons.css'

class ShareButtons extends Component {
    render() {
        return (
            <div className={styles.shareIcons}>
                <p className={styles.shareText}>Spread the love</p>
                <a href="#">
                    <img width={25} height={25} src="/img/face.png" />
                </a>
                <a href="#">
                    <img width={25} height={25} src="/img/twitt.png" />
                </a>
                <a href="#">
                    <img width={25} height={25} src="/img/@.png" />
                </a>
                <a href="#">
                    <img width={25} height={25} src="/img/ic.png" />
                </a>
                <div id={styles.fedIcon}>
                    <a href="#" className={styles.FedLink}>
                        FEEDBACK
                    </a>
                </div>
            </div>
        )
    }
}

export default ShareButtons
