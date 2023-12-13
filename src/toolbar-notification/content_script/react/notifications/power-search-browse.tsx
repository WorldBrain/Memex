import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'

const styles = require('./power-search-browse.css')

export default function PowerSearchBrowse({ onCloseRequested }) {
    return (
        <div className={styles.container}>
            <NotificationLayout
                title={''}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
            >
                <div className={styles.notifContainer}>
                    <div className={styles.title}>
                        Memex makes every page you visit full-text searchable.
                    </div>
                    <div className={styles.instructions}>
                        Type this shortcut into the address bar and search with
                        a term you see on this page
                    </div>
                    <div className={styles.tutorial}>
                        <div className={styles.keyboardM}>M</div>
                        <div className={styles.keyboardPlus}>then</div>
                        <div className={styles.keyboardSpace}>Space</div>
                    </div>
                </div>
            </NotificationLayout>
        </div>
    )
}

PowerSearchBrowse['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
