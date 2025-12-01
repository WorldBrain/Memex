import React, { PureComponent } from 'react'
import cx from 'classnames'

export interface Props {
    value: string
    subtitle: string
    active?: boolean
    available?: boolean
    small?: boolean
    onClick: () => void
}

export interface State {}

class CheckmarkRow extends PureComponent<Props, State> {
    static defaultProps = {
        small: false,
        available: false,
    }

    render() {
        const { value, subtitle, onClick, small, active } = this.props
        return (
            <div
                className={cx({
                    small: small,
                    active: active,
                })}
                onClick={onClick}
            >
                <div>
                    <p>{value}</p>
                    <p>{subtitle}</p>
                </div>
                <span />
            </div>
        )
    }
}

export default CheckmarkRow
