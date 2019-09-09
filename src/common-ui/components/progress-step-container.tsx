import React, { PureComponent } from 'react'
import cx from 'classnames'
import ProgressStep from './progress-step'

const styles = require('./progress-step.css')

interface Props {
    totalSteps: number
    currentStep?: number
}

export default class ProgressWrapper extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <div className={styles.progressContainer}>
                    {[...Array(this.props.totalSteps).keys()].map((data, i) => (
                        <ProgressStep
                            key={i}
                            isSeen={i <= this.props.currentStep}
                        />
                    ))}
                </div>
            </React.Fragment>
        )
    }
}
