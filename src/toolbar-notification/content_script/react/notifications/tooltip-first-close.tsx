import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const images = {
    arrowUp: getExtURL('/img/arrowUp.svg'),
}

export default function TooltipFirstCloseNotification({ onCloseRequested }) {
    return (
        <div>
            {/* <img className={styles.notifIcon} src={images.notifIcon}/> */}
            <NotificationLayout
                title={'Turn on/off Highlighter permanently'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrowUp}
            >
                Via the little <span /> icon in the browser menu
            </NotificationLayout>
        </div>
    )
}

TooltipFirstCloseNotification['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
