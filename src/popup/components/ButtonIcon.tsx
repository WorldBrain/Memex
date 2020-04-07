import React, { PureComponent } from 'react'
import cx from 'classnames'

import { OutLink } from '../../common-ui/containers'

const styles = require('./Button.css')

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

        return <div className={styles.badge}>{this.props.badgeCount}</div>
    }

    render() {
        return (
            <OutLink
                className={cx(styles.button, this.props.className)}
                tabIndex="-1"
                to={this.props.href}
            >
                <div
                    className={cx(
                        styles.customIcon,
                        styles.buttonIcons,
                        this.props.btnClass,
                    )}
                />
                {this.renderBadge()}
            </OutLink>
        )
    }
}

export default ButtonIcon
