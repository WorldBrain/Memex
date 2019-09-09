import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { Checkbox, ProgressStepContainer } from 'src/common-ui/components'
import OnboardingRibbonSettings from './onboarding-ribbon-settings'
import OnboardingTooltipSettings from './onboarding-tooltip-settings'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div>
                    {/* we will only have one container, its the onboarding content that will change out. */}
                    <div className={styles.container}>
                        {/* STEP 0 */}
                        <div>
                            <h1 className={styles.heading1}>
                                Let us take you through a few key settings to
                                make sure you get the most out of Memex
                            </h1>
                            <img />
                            <div className={styles.text}>
                                <p>
                                    Have control over how much of your history
                                    is captured
                                </p>
                                <p>Have control over how Memex is displayed</p>
                            </div>
                            <div>
                                <a className={styles.CTA}>Get started</a>
                            </div>
                            <ProgressStepContainer totalSteps={4} />
                        </div>
                    </div>

                    <div className={styles.container}>
                        {/* STEP 1 */}
                        <h2 className={styles.heading2}>
                            Can’t remember where you found something but know
                            the text you are after?
                        </h2>
                        <img />
                        <div className={styles.text}>
                            <p>
                                All pages you visited more than 5 seconds are
                                full-text searchable
                            </p>
                            <a className={styles.settingsButton}>
                                Change settings
                            </a>
                        </div>
                        <div>
                            <a className={styles.CTA}>Next</a>
                        </div>
                        <ProgressStepContainer totalSteps={4} currentStep={0} />
                    </div>

                    <div className={styles.container}>
                        {/* STEP 2 */}
                        <h2 className={styles.heading2}>
                            Use the tooltip when browsing the web to allow for
                            quick annotations and sharing
                        </h2>
                        <img />
                        <div className={styles.text}>
                            <OnboardingTooltipSettings />
                        </div>
                        <div>
                            <a className={styles.CTA}>Next</a>
                        </div>
                        <ProgressStepContainer totalSteps={4} currentStep={1} />
                    </div>

                    <div className={styles.container}>
                        {/* STEP 3 */}
                        <h2 className={styles.heading2}>
                            Have quick access to key features by enabling the
                            sidebar
                        </h2>
                        <img />
                        <div className={styles.text}>
                            <OnboardingRibbonSettings />
                        </div>
                        <div>
                            <a className={styles.CTA}>Next</a>
                        </div>
                        <ProgressStepContainer totalSteps={4} currentStep={2} />
                    </div>

                    <div className={styles.container}>
                        {/* STEP 2 */}
                        <h2 className={styles.heading2}>
                            Powerup your indexing with custom keyboard shortcuts
                        </h2>
                        <img />
                        <div className={styles.text}>
                            <p>Enable quick edit in sidebar</p>
                        </div>
                        <div>
                            <a className={styles.CTA}>
                                All done! Go to the dashboard
                            </a>
                        </div>
                        <ProgressStepContainer totalSteps={4} currentStep={3} />
                    </div>
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
