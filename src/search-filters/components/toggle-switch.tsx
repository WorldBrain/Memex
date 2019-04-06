import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./toggle-switch.css')

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
            <div className={styles.tagName}>
                <span className={styles.value}>{value}</span>
                <div className={styles.switch} onClick={onClick}>
                    <div
                        className={cx(styles.slider, styles.round, {
                            [styles.sliderChecked]: active,
                        })}
                    />
                </div>
            </div>
        )
    }
}

export default ToggleSwitch
