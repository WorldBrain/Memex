import React, { PureComponent } from 'react'
import cx from 'classnames'

export interface Props {
    value: string
    subtitle?: string
    active?: boolean
    onClick: () => void
}

export interface State {}

class ToggleSwitch extends PureComponent<Props, State> {
    render() {
        const { value, subtitle, onClick, active } = this.props
        return (
            <div>
                <span>{value}</span>
                <div onClick={onClick}>
                    <div />
                </div>
            </div>
        )
    }
}

export default ToggleSwitch
