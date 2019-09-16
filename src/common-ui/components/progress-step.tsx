import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./progress-step.css')

interface Props {
    onClick: () => void
    isSeen?: boolean
    isCurrentStep: boolean
}

export default class ProgressStep extends PureComponent<Props> {
    render() {
        return (
            <span
                onClick={this.props.onClick}
                className={cx(styles.progressStep, {
                    [styles.progressStepSeen]: this.props.isSeen,
                    [styles.progressStepCurrent]: this.props.isCurrentStep,
                })}
            />
        )
    }
}
