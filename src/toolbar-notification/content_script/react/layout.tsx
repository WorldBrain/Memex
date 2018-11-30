import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './layout.css'

export default function NotificationLayout({
    title,
    icon = null,
    children,
    onCloseRequested,
}) {
    return (
        <div className={styles.container}>
            <div className={styles.left}>
                {}
                <div className={classNames([styles.icon, icon])} />
            </div>
            <div className={styles.middle}>
                <div className={styles.title}>{title}</div>
                <div className={styles.body}>{children}</div>
            </div>
            <div className={styles.right}>
                <div className={styles.close} onClick={onCloseRequested} />
            </div>
        </div>
    )
}

NotificationLayout.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string,
    children: PropTypes.node.isRequired,
    onCloseRequested: PropTypes.func.isRequired,
}
