import React, { MouseEventHandler, PureComponent } from 'react'
import cx from 'classnames'

export interface Props {
    value: string
    noBg: boolean
    onClick: MouseEventHandler<HTMLSpanElement>
    setRef?: (el: HTMLSpanElement) => void
}

class TagPill extends PureComponent<Props> {
    static defaultProps = {
        noBg: false,
        onClick: (f) => f,
    }

    render() {
        return (
            <span
                ref={this.props.setRef}
                onClick={this.props.onClick}
                title={this.props.value}
            >
                {this.props.value}
            </span>
        )
    }
}

export default TagPill
