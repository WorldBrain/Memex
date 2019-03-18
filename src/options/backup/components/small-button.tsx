import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./small-button.css')

interface Props {
    children: React.ReactChild
    onClick: (...args: any[]) => any
    extraClass?: string
    color: 'green' | 'white' | 'darkblue' | 'red'
}

export default class SmallButton extends PureComponent<Props, {}> {
    render() {
        return (
            <button
                onClick={this.props.onClick}
                className={cx(
                    styles.button,
                    styles.text,
                    styles[this.props.color],
                    this.props.extraClass,
                )}
            >
                {this.props.children}
            </button>
        )
    }
}
