import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./progress-step.css')

interface Props {
    onClick: () => void
    isSeen?: boolean
    isCurrentStep: boolean
}

const noop = () => undefined

export default class ProgressStep extends PureComponent<Props> {
    render() {
        return (
            <span
                onClick={this.props.isSeen ? this.props.onClick : noop}
                className={cx(styles.progressStep, {
                    [styles.progressStepSeen]: this.props.isSeen,
                    [styles.progressStepCurrent]: this.props.isCurrentStep,
                })}
            />
        )
    }
}
