import React from 'react'

import { ProgressStepContainer } from 'src/common-ui/components'

const styles = require('./onboarding-box.css')

export interface Props {
    isInitStep?: boolean
    titleText: string
    subtitleText?: string
    totalSteps: number
    currentStep?: number
    renderButton: () => JSX.Element
    renderImage: () => JSX.Element
    goToStep?: (step: number) => () => void
}

export default class OnboardingStep extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        renderImage: () => undefined,
    }

    private get headerClassName() {
        return this.props.isInitStep ? styles.heading1 : styles.heading2
    }

    render() {
        return (
            <div
                className={
                    this.props.isInitStep
                        ? styles.initStepContainer
                        : styles.container
                }
            >
                <div>
                    <h1 className={this.headerClassName}>
                        {this.props.titleText}
                    </h1>
                    {!this.props.isInitStep && (
                        <p className={styles.textLarge}>
                            {this.props.subtitleText}
                        </p>
                    )}
                    {this.props.renderImage()}
                    <div className={styles.text}>{this.props.children}</div>
                </div>
                <div>
                    {this.props.renderButton()}
                    {!this.props.isInitStep && (
                        <ProgressStepContainer
                            onStepClick={this.props.goToStep}
                            totalSteps={this.props.totalSteps}
                            currentStep={this.props.currentStep}
                        />
                    )}
                </div>
            </div>
        )
    }
}
