import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    notifIcon: getExtURL('img/tooltipIcon_blue.svg'),
    brainIcon: getExtURL('/img/worldbrain-logo-narrow-bw-48.png'),
    arrowUp: getExtURL('/img/notifArrowUp.svg'),
    closeIcon: getExtURL('/img/cross.svg'),
}

export default function TooltipFirstCloseNotification({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            {/*<img className={styles.notifIcon} src={images.notifIcon}/>*/}
            <NotificationLayout
                title={'Turn on/off Highlighter permanently'}
                icon={images.notifIcon}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrowUp}
                closeIcon={images.closeIcon}
            >
                Via the little{' '}
                <img src={images.brainIcon} className={styles.icon} />
                icon in the menu
            </NotificationLayout>
        </div>
    )
}

TooltipFirstCloseNotification['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
