import React, { PureComponent } from 'react'
import cx from 'classnames'

interface Props {
    children: React.ReactNode
    onClick: (...args: any[]) => any
    extraClass?: string
    color: 'green' | 'white' | 'darkblue' | 'red'
}

export default class SmallButton extends PureComponent<Props, {}> {
    render() {
        return (
            <button
                onClick={this.props.onClick}
                className={cx(this.props.extraClass)}
            >
                {this.props.children}
            </button>
        )
    }
}
