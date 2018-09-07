import React, { PureComponent, ReactChild } from 'react'
import cx from 'classnames'

const styles = require('./Button.css')

export interface Props {
    iconClass: string
    children: ReactChild[]
}

class SplitButton extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.item}>
                {this.props.iconClass && (
                    <div
                        className={cx(styles.customIcon, this.props.iconClass)}
                    />
                )}
                <div className={styles.splitBtn}>{this.props.children}</div>
            </div>
        )
    }
}

export default SplitButton
