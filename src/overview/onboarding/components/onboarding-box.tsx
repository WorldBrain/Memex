import React, { PureComponent } from 'react'
import OnboardingChecklist from './checklist-container'
import classNames from 'classnames'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div className={styles.container}>
                    <OnboardingChecklist />
                </div>
                <div className={styles.footer}>
                    <div className={styles.textContainer}>
                        <p className={styles.bold}>
                            Import your bookmarks and existing history
                        </p>
                    </div>
                    <div className={styles.iconBox}>
                    <span className={classNames(styles.icon, styles.pocket)}/>
                    <span className={classNames(styles.icon, styles.diigo)}/>
                    <span className={classNames(styles.icon, styles.chrome)}/>
                    <span className={classNames(styles.icon, styles.firefox)}/>
                    <span className={classNames(styles.icon, styles.raindrop)}/>
                    <span className={classNames(styles.icon, styles.instapaper)}/>
                    </div>

                    <a
                        className={styles.learnMore}
                        target="_blank"
                        href="#/import"
                    >
                        Import Now
                    </a>
                    {/* <a className={styles.settings} href="#privacy" /> */}
                </div>
            </React.Fragment>
        )
    }
}

export default OnboardingBox
