import React, { MouseEventHandler, PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./TagPill.css')

export interface Props {
    value: string
    noBg: boolean
    onClick: MouseEventHandler<HTMLSpanElement>
    setRef?: (el: HTMLSpanElement) => void
}

class TagPill extends PureComponent<Props> {
    static defaultProps = {
        noBg: false,
        onClick: f => f,
    }

    private get tagClass() {
        return cx(styles.tagname, {
            [styles.notExpanded]: !this.props.noBg,
        })
    }

    render() {
        return (
            <span
                ref={this.props.setRef}
                className={this.tagClass}
                onClick={this.props.onClick}
                title={this.props.value}
            >
                {this.props.value}
            </span>
        )
    }
}

export default TagPill
