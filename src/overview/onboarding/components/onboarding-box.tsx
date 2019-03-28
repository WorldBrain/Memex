import React, { PureComponent } from 'react'
import OnboardingChecklist from './checklist-container'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div className={styles.logo}/>
                <div className={styles.container}>
                    <OnboardingChecklist />
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
                    {/* <a className={styles.settings} href="#privacy" /> */}
                </div>
            </React.Fragment>
        )
    }
}

export default OnboardingBox
