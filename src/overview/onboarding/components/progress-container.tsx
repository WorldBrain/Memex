import React, { PureComponent } from 'react'
import cx from 'classnames'
import ProgressDot from './progress-dot'

const styles = require('./onboarding-box.css')

interface Props {
    totalSteps: number
    currentStep: number
}

export default class ProgressWrapper extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <div className={styles.progressContainer}>
                    <ProgressDot isSeen />
                    <ProgressDot />
                    <ProgressDot />
                </div>
            </React.Fragment>
        )
    }
}

// TODO set child prop isSeen if current step is equal or less than step count?? or a better way..
// TODO render as many of these ProgressDot components as manay times as total steps
