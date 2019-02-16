import React, { PureComponent } from 'react'
import OnboardingChecklist from './checklist-container'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div className={styles.container}>
                    <div className={styles.leftParent}>
                        <p className={styles.welcome}>
                            Welcome to <br /> your Memex
                        </p>
                        <p className={styles.text}>
                            The all-in-one tool to get on top of
                            <br />
                            your online chaos.
                        </p>
                        <div className={styles.privacyImage} />
                    </div>
                    <div className={styles.rightParent}>
                        <OnboardingChecklist />
                    </div>
                </div>
                <div className={styles.footer}>
                    <div className={styles.textContainer}>
                        <p className={styles.bold}>
                            All data stored on your computer
                        </p>
                        <p className={styles.subtextGreen}>
                            Your data is not our business model
                        </p>
                    </div>
                    <a
                        className={styles.learnMore}
                        target="_blank"
                        href="https://worldbrain.io/privacy"
                    >
                        Learn more
                    </a>
                    <a className={styles.settings} href="#privacy" />
                </div>
            </React.Fragment>
        )
    }
}

export default OnboardingBox
