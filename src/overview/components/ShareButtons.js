import React
from 'react'
import styles from './ShareButtons.css'
import {Link} from 'react-router-dom'

const ShareButtons = props => (

    <div className={styles.shareIcons}>
        <p className={styles.shareText}>
            Spread the love
        </p>{' '}
        <a href="#">
            <img className={styles.shareImg} vspace={2} src="/img/face.png"/>
        </a>{' '}
        <a Link to="/">
            <img className={styles.shareImg} vspace={2} src="/img/twitt.png"/>
        </a>{' '}
        <a Link to="#">
            <img className={styles.shareImg} vspace={2} src="/img/@.png"/>
        </a>{' '}
        <a Link to="#">
            <img className={styles.shareImg} vspace={2} src="/img/ic.png"/>
        </a>{' '}
        <div className={styles.fedIcon}>
            <a Link to="#" className={styles.fedLink}>
                Feedback{' '}
            </a>{' '}
        </div>{' '}
    </div>
)

export default ShareButtons