import React from 'react'
import classNames from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import styles from './UpgradeButton.css'

const UpgradeButton = () => (
    <OutLink
        className={classNames(styles.upgradeButton)}
        href="https://worldbrain.io/pricing"
    >
        Upgrade Memex
    </OutLink>
)

export default UpgradeButton
