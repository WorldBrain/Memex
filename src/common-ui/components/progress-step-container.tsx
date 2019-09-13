import React, { PureComponent } from 'react'

import ProgressStep from './progress-step'

const styles = require('./progress-step.css')

interface Props {
    totalSteps: number
    onStepClick: (step: number) => () => void
    currentStep?: number
}

export default class ProgressWrapper extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.progressContainer}>
                {[...Array(this.props.totalSteps).keys()].map((data, i) => (
                    <ProgressStep
                        isSeen={i <= this.props.currentStep}
                        isCurrentStep={i === this.props.currentStep}
                        onClick={this.props.onStepClick(i + 1)}
                        key={i}
                    />
                ))}
            </div>
        )
    }
}
