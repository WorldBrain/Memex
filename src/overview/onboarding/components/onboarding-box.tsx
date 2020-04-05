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
                    </div>
                    <div className={styles.backgroundColor} />
                </div>
            </div>
        )
    }
}

export default OnboardingBox
