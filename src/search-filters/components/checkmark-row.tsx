import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./checkmark-row.css')

export interface Props {
    value: string
    subtitle: string
    active: boolean
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
                className={cx(styles.container, {
                    [styles.small]: small,
                    [styles.active]: active,
                })}
                onClick={onClick}
            >
                <div className={styles.item}>
                    <p className={styles.title}>{value}</p>
                    <p className={styles.sub}>{subtitle}</p>
                </div>
                <span className={styles.checkmark} />
            </div>
        )
    }
}

export default CheckmarkRow
