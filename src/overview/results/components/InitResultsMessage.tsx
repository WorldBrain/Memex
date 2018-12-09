import React, { PureComponent } from 'react'
import { Link } from 'react-router'

import OnboardingChecklist from '../../onboarding/components/OnboardingChecklist'
import ResultsMessage from './ResultsMessage'

const styles = require('./InitResultsMessage.css')

class InitResultsMessage extends PureComponent {
    render() {
        return (
            <ResultsMessage>
                <div className={styles.container}>
                    <div className={styles.leftParent}>
                        <p className={styles.welcome}>Welcome to your Memex</p>
                        <p className={styles.text}>
                            The all-in-one tool to get
                            <br /> on top of your online chaos.
                        </p>
                        <div className={styles.privacyImage} />
                    </div>
                    <div className={styles.rightParent}>
                        <OnboardingChecklist />
                    </div>
                </div>
                <div className={styles.footer}>
                    {/* <img></img> */}
                    <div className={styles.textContainer}>
                        <p className={styles.bold}>
                            ALL DATA STORED ON YOUR COMPUTER
                        </p>
                        <p className={styles.subtextGreen}>
                            Your data is not our business model
                        </p>
                    </div>
                    <div className={styles.learnMore}>learn more</div>
                    <div className={styles.settings} />
                </div>
            </ResultsMessage>
        )
    }
}

export default InitResultsMessage
