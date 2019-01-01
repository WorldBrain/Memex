import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    notifIcon: getExtURL('img/tooltipIcon_blue.svg'),
    closeIcon: getExtURL('/img/cross.svg'),
}

export default function OnboardingHighlightText({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            <NotificationLayout
                title={'STEP 1: Highlight some text'}
                icon={images.notifIcon}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
                closeIcon={images.closeIcon}
            >
                Just like you would normally do to copy/paste stuff.
            </NotificationLayout>
        </div>
    )
}

OnboardingHighlightText['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
