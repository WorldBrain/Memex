import React, { PureComponent } from 'react'
import classNames from 'classnames'

import { OutLink } from '../../common-ui/containers'

const styles = require('./UpgradeButton.css')

class UpgradeButton extends PureComponent {
    render() {
        return (
            <OutLink
                className={classNames(styles.upgradeButton)}
                to="https://worldbrain.io/pricing"
            >
                Upgrade Memex
            </OutLink>
        )
    }
}

export default UpgradeButton
