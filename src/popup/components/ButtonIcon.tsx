import React, { PureComponent } from 'react'
import cx from 'classnames'

import OutLink from 'src/common-ui/containers/OutLink'

export interface Props {
    className?: string
    icon: string
    btnClass: string
    href: string
    badgeCount?: number
}

class ButtonIcon extends PureComponent<Props> {
    private renderBadge() {
        if (!this.props.badgeCount || this.props.badgeCount < 1) {
            return null
        }

        return <div>{this.props.badgeCount}</div>
    }

    render() {
        return (
            <OutLink
                className={cx(this.props.className)}
                tabIndex="-1"
                to={this.props.href}
            >
                <div className={cx(this.props.btnClass)} />
                {this.renderBadge()}
            </OutLink>
        )
    }
}

export default ButtonIcon
