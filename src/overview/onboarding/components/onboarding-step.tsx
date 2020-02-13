import React from 'react'

import { ProgressStepContainer } from 'src/common-ui/components'

const styles = require('./onboarding-box.css')

export interface Props {
    isInitStep?: boolean
    titleText: string
    subtitleText?: string
    subtitleText2?: string
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
        if (this.props.isInitStep) {
            return (
                <div className={styles.startingPage}>
                    <div className={styles.stepContainer}>
                        <h1 className={this.headerClassName}>
                            {this.props.titleText}
                        </h1>
                        <div>{this.props.children}</div>
                    </div>
                    <div className={styles.navigation}>
                        {this.props.renderButton()}
                    </div>
                </div>
            )
        }
        return (
            <div className={styles.featuresContainer}>
                <div className={styles.titleContainer}>
                    <div className={styles.title}>{this.props.titleText}</div>
                    <div className={styles.subTitle}>
                        {this.props.subtitleText}
                    </div>
                    <div className={styles.subTitle2}>
                        {this.props.subtitleText2}
                    </div>
                    <div className={styles.settingsContainer}>
                        <div className={styles.settingsAction}>
                            {this.props.children}
                        </div>
                    </div>
                </div>
                <div className={styles.bottomContainer}>
                    <div className={styles.backButtonArea} />
                    <div className={styles.featureImageArea}>
                        {this.props.renderImage()}
                    </div>
                    <div className={styles.nextButtonArea}>
                        {this.props.renderButton()}
                        <ProgressStepContainer
                            onStepClick={this.props.goToStep}
                            totalSteps={this.props.totalSteps}
                            currentStep={this.props.currentStep}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
