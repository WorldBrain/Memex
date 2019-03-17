import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import { getExtURL } from '../utils.js'

const styles = require('./power-search-browse.css')

export default function PowerSearchBrowse({ onCloseRequested, openDashboard }) {
    return (
        <div className={styles.container}>
            <NotificationLayout
                title={''}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
            >
                <div className={styles.notifContainer}>
                    <p className={styles.title}>
                        Memex makes every page you visit full-text searchable.
                    </p>
                    <p className={styles.instructions}>
                        Try searching with a term either on this page on the<br/>
                        <span className={styles.button} onClick={openDashboard}>
                            Dashboard
                        </span>{' '}
                        or via the URL bar by typing{' '}
                    </p>
                    <p className={styles.keys}>
                        <span className={styles.key}>W</span>+
                        <span className={styles.key}>SPACE</span>
                        or
                        <span className={styles.key}>TAB</span>
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
