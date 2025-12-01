import React from 'react'
import ProgressStepContainer from 'src/common-ui/components/progress-step-container'

export interface Props {
    isInitStep?: boolean
    privacyStep?: boolean
    titleText: string
    subtitleText?: string
    subtitleText2?: string
    totalSteps: number
    currentStep?: number
    renderButton: () => JSX.Element
    renderImage: () => JSX.Element
    goToStep?: (step: number) => () => void
    navToOverview: () => void
}

export default class OnboardingStep extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        renderImage: () => undefined,
    }

    private get headerClassName() {
        return this.props.isInitStep ? 'heading1' : 'heading2'
    }

    render() {
        if (this.props.isInitStep) {
            return (
                <div className="startingPage">
                    <div className="stepContainer">
                        <div className="featureImageArea">
                            {this.props.renderImage()}
                        </div>
                        <h1 className={this.headerClassName}>
                            {this.props.titleText}
                        </h1>
                        <div className="subTitle">
                            {this.props.subtitleText}
                        </div>
                        <div className="whiteSpace30" />
                    </div>
                    <div className="navigation">
                        {this.props.renderButton()}
                    </div>
                </div>
            )
        }
        if (this.props.privacyStep) {
            return (
                <div className="startingPage">
                    <div className="stepContainer">
                        <h1 className={this.headerClassName}>
                            {this.props.titleText}
                        </h1>
                        <div className="subTitle">
                            {this.props.subtitleText}
                        </div>
                        <div className="subTitle2">
                            {this.props.subtitleText2}
                        </div>
                        <div className="whiteSpace30" />
                        <div>{this.props.children}</div>
                    </div>
                    <div className="whiteSpace30" />
                    <div className="whiteSpace30" />
                    <div className="navigation">
                        {this.props.renderButton()}
                    </div>
                </div>
            )
        }
        return (
            <div className="featuresContainer">
                <div className="titleContainer">
                    <div className="title">{this.props.titleText}</div>
                    <div className="subTitle">{this.props.subtitleText}</div>
                    <div className="subTitle2">{this.props.subtitleText2}</div>
                    <div className="settingsContainer">
                        <div className="settingsAction">
                            {this.props.children}
                        </div>
                    </div>
                </div>
                <div className="bottomContainer">
                    <div className="backButtonArea" />
                    <div className="featureImageArea">
                        {this.props.renderImage()}
                    </div>
                    <div className="nextButtonArea">
                        {this.props.renderButton()}
                        <ProgressStepContainer
                            onStepClick={this.props.goToStep}
                            totalSteps={this.props.totalSteps}
                            currentStep={this.props.currentStep}
                        />
                        <div
                            className="skipButton"
                            onClick={this.props.navToOverview}
                        >
                            skip
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
