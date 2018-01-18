import React from 'react'
import classNames from 'classnames'
import styles from './UpgradeButton.css'

const UpgradeButton = () => (
    <a
        className={classNames(styles.upgradeButton)}
        href="https://worldbrain.io/pricing"
        target="_blank"
    >
        Upgrade
    </a>
)

export default UpgradeButton
