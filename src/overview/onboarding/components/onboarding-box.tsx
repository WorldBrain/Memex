import React, { PureComponent } from 'react'
import classNames from 'classnames'
import ProgressDot from './progress-dot'
import ProgressContainer from './progress-container'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div>
                    <div className={styles.container}>
                        <h1 className={styles.heading1}>
                            Let us take you through a few key settings to make
                            sure you get the most out of Memex
                        </h1>
                        <img />
                        <div className={styles.text}>
                            <p>
                                Have control over how much of your history is
                                captured
                            </p>
                            <p>Have control over how Memex is displayed</p>
                        </div>
                        <div>
                            <a className={styles.CTA}>Get started</a>
                        </div>
                        <ProgressContainer totalSteps={4} currentStep={0} />
                    </div>

                    <div className={styles.container}>
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
                            <a className={styles.grayActionButton}>Settings</a>
                        </div>
                        <div>
                            <a className={styles.CTA}>Next</a>
                        </div>
                        <ProgressContainer totalSteps={4} currentStep={1} />
                    </div>
                </div>

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
