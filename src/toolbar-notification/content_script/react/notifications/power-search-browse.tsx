import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./power-search-browse.css')

const images = {
    closeIcon: getExtURL('/img/cross.svg'),
    annotateIcon: getExtURL('/img/annotate.svg'),
    shareIcon: getExtURL('/img/share.svg'),
}

export default function PowerSearchBrowse({
    onCloseRequested,
    triggerNextNotification,
    openDashboard,
}) {
    return (
        <div className={styles.container}>
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
                    <div className={styles.button} onClick={openDashboard}>
                        Get me there
                    </div>
                    <p
                        onClick={triggerNextNotification}
                        className={styles.pointer}
                    >
                        Or browse around a bit
                    </p>
                    <br />
                    <p>
                        <span className={styles.emoji}>🤓</span>
                        <span>
                            <b className={styles.protip}>Pro Tip: </b>
                            Search via the address bar with
                            <span className={styles.key}>M</span>+
                            <span className={styles.key}>SPACE</span>
                        </span>
                    </p>
                </div>
            </NotificationLayout>
        </div>
    )
}

PowerSearchBrowse['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
    triggerNextNotifcation: PropTypes.func,
    openDashboard: PropTypes.func.isRequired,
}
