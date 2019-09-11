import React, { PureComponent } from 'react'

import NextStepButton from './next-step-button'
import OnboardingStep from './onboarding-step'
import OnboardingRibbonSettings from './onboarding-ribbon-settings'
import OnboardingTooltipSettings from './onboarding-tooltip-settings'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    private get totalSteps() {
        return 4
    }

    private renderPlaceholderImage = () => (
        <img className={styles.placeholder} width="400px" height="200px" />
    )

    render() {
        return (
            <React.Fragment>
                <div>
                    <OnboardingStep
                        isInitStep
                        titleText="Let us take you through a few key settings to make sure you get the most out of Memex"
                        totalSteps={this.totalSteps}
                        renderButton={() => (
                            <NextStepButton>Get started</NextStepButton>
                        )}
                    >
                        <p>
                            Have control over how much of your history is
                            captured
                        </p>
                        <p>Have control over how Memex is displayed</p>
                    </OnboardingStep>
                    <OnboardingStep
                        titleText="Can’t remember where you found something but know the text you are after?"
                        renderButton={() => (
                            <NextStepButton color="mint">Next</NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={this.totalSteps}
                        currentStep={0}
                    >
                        <p>
                            All pages you visited more than 5 seconds are
                            full-text searchable
                        </p>
                        <a className={styles.settingsButton}>Change settings</a>
                    </OnboardingStep>
                    <OnboardingStep
                        titleText="Use the tooltip when browsing the web to allow for quick annotations and sharing"
                        renderButton={() => (
                            <NextStepButton color="blue">Next</NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={this.totalSteps}
                        currentStep={1}
                    >
                        <OnboardingTooltipSettings />
                    </OnboardingStep>
                    <OnboardingStep
                        titleText="Have quick access to key features by enabling the sidebar"
                        renderButton={() => (
                            <NextStepButton color="purple">Next</NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={this.totalSteps}
                        currentStep={2}
                    >
                        <OnboardingRibbonSettings />
                    </OnboardingStep>

                    <OnboardingStep
                        titleText="Powerup your indexing with custom keyboard shortcuts"
                        renderButton={() => (
                            <NextStepButton color="purple">
                                All done! Go to the dashboard
                            </NextStepButton>
                        )}
                        renderImage={this.renderPlaceholderImage}
                        totalSteps={this.totalSteps}
                        currentStep={3}
                    >
                        <p>Enable keyboard shortcuts</p>
                    </OnboardingStep>
                </div>

                <div className={styles.backgroundBlob} />

                <div className={styles.center}>
                    <p className={styles.skipTitle}>Skip setup</p>
                    <p className={styles.skipDesc}>
                        Give me the default settings
                    </p>
                </div>
            </React.Fragment>
        )
    }
}

export default OnboardingBox

// TODO styles.container could be turned into a component taking heading, image, content, onSubmit action
