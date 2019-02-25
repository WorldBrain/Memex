import React from 'react'
import Styles from '../styles.css'

export function BackupHeader() {
    return (
        <div>
            <p className={Styles.backupTitle}>Backup & Restore</p>
            <p className={Styles.subtitle}>
				Safely backup your data to your computer or to your favorite cloud.
            </p>
        </div>
    )
}
