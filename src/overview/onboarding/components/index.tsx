import React, { PureComponent } from 'react'

import OnboardingChecklist from '../../onboarding/components/OnboardingChecklist'

const styles = require('./index.css')

class InitResultsMessage extends PureComponent {
    render() {
        return (
            <React.Fragment>
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
            </React.Fragment>
        )
    }
}

export default InitResultsMessage
