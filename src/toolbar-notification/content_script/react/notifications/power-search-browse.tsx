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

export default function PowerSearchBrowse({ onCloseRequested, openDashboard }) {
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
                        From now on you can search with any word of any page you
                        visit.
                    </p>
                    <p className={styles.instructions}>
                        Search via the{' '}
                        <span className={styles.button} onClick={openDashboard}>
                            Dashboard
                        </span>{' '}
                        or the address bar by typing{' '}
                    </p>
                    <p className={styles.keys}>
                        <span className={styles.key}>W</span>+
                        <span className={styles.key}>SPACE</span>
                    </p>
                </div>
            </NotificationLayout>
        </div>
    )
}

PowerSearchBrowse['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
    openDashboard: PropTypes.func.isRequired,
}
