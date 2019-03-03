import React, { PureComponent } from 'react'
import SVGInject from '@iconfu/svg-inject'
import OnboardingChecklist from './checklist-container'
import { PrivacyImage } from './../../../Icons'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div className={styles.container}>
                    <div className={styles.leftParent}>
                        <p className={styles.welcome}>Welcome to your</p>
                        <div className={styles.logo} />
                        <p className={styles.text}>
                            The all-in-one tool to get on top of your online
                            chaos.
                        </p>
                        <img
                            className={styles.privacyImage}
                            src={PrivacyImage}
                            onLoad={SVGInject(PrivacyImage)}
                        />
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
                    {/* <a className={styles.settings} href="#privacy" /> */}
                </div>
            </React.Fragment>
        )
    }
}

export default OnboardingBox
