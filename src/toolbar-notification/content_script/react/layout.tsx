import React from 'react'
import PropTypes from 'prop-types'

const styles = require('./layout.css')

export default function NotificationLayout({
    title,
    children,
    onCloseRequested,
    thirdRowImage,
}) {
    return (
        <div className={styles.container}>
            <div className={styles.middle}>
                <div className={styles.title}>{title}</div>
                <div className={styles.body}>{children}</div>
            </div>
            <div className={styles.right}>
                {thirdRowImage && (
                    <img src={thirdRowImage} className={styles.thirdRowImage}/>
                )}
                <span
                    className={styles.close}
                    onClick={() => onCloseRequested()}
                />
            </div>
        </div>
    )
}

NotificationLayout['propTypes'] = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    onCloseRequested: PropTypes.func.isRequired,
}
