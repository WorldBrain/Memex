import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    closeIcon: getExtURL('/img/cross.svg'),
    annotateIcon: getExtURL('/img/annotate.svg'),
    shareIcon: getExtURL('/img/share.svg'),
}

export default function OnboardingSelectOption({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            <NotificationLayout
                title={'STEP 2: SELECT OPTION'}
                icon={null}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
                closeIcon={images.closeIcon}
            >
                <img src={images.annotateIcon} className={styles.icon} />
                Add a note to this highlight
                <br />
                <img src={images.shareIcon} className={styles.icon} />
                Share a link to this higlight
            </NotificationLayout>
        </div>
    )
}

OnboardingSelectOption.propTypes = {
    onCloseRequested: PropTypes.func.isRequired,
}
