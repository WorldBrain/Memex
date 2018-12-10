import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import styles from './ribbon-first-close.css'
import { getExtURL } from '../utils.js'

const images = {
    notifIcon: getExtURL('img/sidebarIcon_blue.svg'),
    brainIcon: getExtURL('/img/worldbrain-logo-narrow-bw-48.png'),
    arrowUp: getExtURL('/img/notifArrowUp.svg'),
    closeIcon: getExtURL('/img/cross.svg'),
}

export default function TooltipFirstCloseNotification({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            {/*<img className={styles.notifIcon} src={images.notifIcon}/>*/}
            <NotificationLayout
                title={'Turn on/off Ribbon permanently'}
                icon={images.notifIcon}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrowUp}
                closeIcon={images.closeIcon}
            >
                Via the little{' '}
                <img src={images.brainIcon} className={styles.brainIcon} />
                icon in the menu
            </NotificationLayout>
        </div>
    )
}

TooltipFirstCloseNotification.propTypes = {
    onCloseRequested: PropTypes.func.isRequired,
}
