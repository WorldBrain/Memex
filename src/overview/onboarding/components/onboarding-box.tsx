import React, { PureComponent } from 'react'

const styles = require('./onboarding-box.css')

export interface Props {
    navToOverview: () => void
}

class OnboardingBox extends PureComponent<Props> {
    render() {
        return (
            <div>
                <div className={styles.flexLayout}>
                    <div className={styles.container}>
                        <div className={styles.whiteBox}>
                            {this.props.children}
                        </div>
                        <div className={styles.skipContainer}>
                            <p
                                className={styles.skipTitle}
                                onClick={this.props.navToOverview}
                            >
                                Skip setup
                            </p>
                            <p className={styles.skipDesc}>
                                Give me the default settings
                            </p>
                        </div>
                    </div>
                    <div className={styles.backgroundColor} />
                </div>
                <div className={styles.backgroundBlobWrapper}>
                    <div className={styles.backgroundBlob} />
                </div>
            </div>
        )
    }
}

export default OnboardingBox

// TODO styles.container could be turned into a component taking heading, image, content, onSubmit action
