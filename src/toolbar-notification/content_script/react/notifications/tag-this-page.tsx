import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    arrowRight: getExtURL('/img/arrowRight.svg'),
}

export default function TagThisPage({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            {/* <img className={styles.notifIcon} src={images.notifIcon}/> */}
            <NotificationLayout
                title={'Star, Tag & sort this page in collections'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={images.arrowRight}
            >
                Move your cursor to the right side of any screen to open the menu.
            </NotificationLayout>
        </div>
    )
}

TagThisPage['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
