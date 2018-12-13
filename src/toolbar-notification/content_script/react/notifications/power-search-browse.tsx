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

export default function PowerSearchBrowse({ onCloseRequested }) {
    return (
        <div className={styles.title}>
            <NotificationLayout
                title={''}
                icon={null}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
                closeIcon={images.closeIcon}
            >
                <div className={styles.notifContainer}>
                    <p className={styles.title}>
                        Search with any word you see here
                    </p>
                    <p>go back to dashboard to try it out.</p>
                    <div className={styles.button}>Get me there</div>
                    <p>Or browse around a bit</p>
                </div>
            </NotificationLayout>
        </div>
    )
}

PowerSearchBrowse.propTypes = {
    onCloseRequested: PropTypes.func.isRequired,
}
