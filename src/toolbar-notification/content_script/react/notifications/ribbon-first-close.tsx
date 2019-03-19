import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'
const styles = require('./ribbon-first-close.css')

const images = {
    arrowUp: getExtURL('/img/notifArrowUp.svg'),
}

export default function TooltipFirstCloseNotification({ onCloseRequested }) {
    return (
        <div>
            {/* <img className={styles.notifIcon} src={images.notifIcon}/> */}
            <NotificationLayout
                title={'Turn on/off Ribbon permanently'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrowUp}
            >
                Via the little{' '}
                <span className={styles.logo}/> icon in
                the browser menu
            </NotificationLayout>
        </div>
    )
}

TooltipFirstCloseNotification['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
