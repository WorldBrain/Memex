import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const images = {
    arrow: getExtURL('/img/arrowUp.svg'),
    logo: getExtURL('/img/worldbrain-logo-narrow-bw-48.png'),
}

export default function GoToDashboard({ onCloseRequested }) {
    return (
        <div>
            {/* <img className={styles.notifIcon} src={images.notifIcon}/> */}
            <NotificationLayout
                title={'Go back to the search dashboard'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrow}
            >
                Via the little <span /> icon in the browser menu
            </NotificationLayout>
        </div>
    )
}

GoToDashboard['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
