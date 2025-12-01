import React, { PureComponent, ReactChild } from 'react'
import cx from 'classnames'

export interface Props {
    iconClass: string
    children: ReactChild[]
}

class SplitButton extends PureComponent<Props> {
    render() {
        return (
            <div>
                {this.props.iconClass && (
                    <div className={cx(this.props.iconClass)} />
                )}
                <div>{this.props.children}</div>
            </div>
        )
    }
}

export default SplitButton
