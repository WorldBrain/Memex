import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./tooltip-first-close.css')

const images = {
    notifIcon: getExtURL('img/tooltipIcon_blue.svg'),
    closeIcon: getExtURL('/img/cross.svg'),
}

export default function OnboardingHighlightText({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            {/*<img className={styles.notifIcon} src={images.notifIcon}/>*/}
            <NotificationLayout
                title={'MAKE YOUR FIRST ANNOTATION'}
                icon={images.notifIcon}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
                closeIcon={images.closeIcon}
            >
                Step 1: Highlight any piece of text on this page
            </NotificationLayout>
        </div>
    )
}

OnboardingHighlightText.propTypes = {
    onCloseRequested: PropTypes.func.isRequired,
}
