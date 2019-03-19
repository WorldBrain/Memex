import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    arrow: getExtURL('/img/arrowUp.svg'),
}

export default function GoToDashboard({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            {/* <img className={styles.notifIcon} src={images.notifIcon}/> */}
            <NotificationLayout
                title={'Go back to the search Dashboard'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrow}
            >
                Via the little{' '}
                <span className={styles.logo}/> icon in
                the browser menu
            </NotificationLayout>
        </div>
    )
}

GoToDashboard['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
