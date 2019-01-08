import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./notifications.css')

const images = {
    annotateIcon: getExtURL('/img/annotate.svg'),
    shareIcon: getExtURL('/img/share.svg'),
}

export default function OnboardingSelectOption({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            <NotificationLayout
                title={'STEP 2: SELECT OPTION IN TOOLTIP'}
                icon={null}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
                closeIcon={null}
            >
                <div className={styles.notifContainer}>
                    <img
                        src={images.annotateIcon}
                        height={'30px'}
                        className={styles.selectIcon}
                    />
                    <div className={styles.notifText}>
                        to add a note to this highlight
                    </div>
                    <br />
                    <img
                        src={images.shareIcon}
                        className={styles.selectIcon}
                        height={'30px'}
                    />
                    <div className={styles.notifText}>
                        to share a link to this higlight
                    </div>
                </div>
            </NotificationLayout>
        </div>
    )
}

OnboardingSelectOption['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
