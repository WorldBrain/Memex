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
                        {this.props.children}
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
            </div>
        )
    }
}

export default OnboardingBox
