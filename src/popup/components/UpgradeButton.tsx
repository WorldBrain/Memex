import React, { PureComponent } from 'react'
import classNames from 'classnames'
import OutLink from 'src/common-ui/containers/OutLink'

class UpgradeButton extends PureComponent {
    render() {
        return (
            <OutLink to="https://worldbrain.io/vote_feature">
                <img src={'/img/vote_white.svg'} />
                Vote for Next Features
            </OutLink>
        )
    }
}

export default UpgradeButton
