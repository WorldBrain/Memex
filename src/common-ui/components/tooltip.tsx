import * as React from 'react'
import classNames from 'classnames'

export interface Props {
    children: React.ReactNode
    position: string
    itemClass?: string
    toolTipType?: string
}

class Tooltip extends React.PureComponent<Props> {
    render() {
        return (
            <span>
                <div className={this.props.itemClass}>
                    <div>{this.props.children}</div>
                </div>
            </span>
        )
    }
}

export default Tooltip
