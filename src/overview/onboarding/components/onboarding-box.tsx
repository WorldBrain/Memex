import React, { PureComponent } from 'react'

const styles = require('./onboarding-box.css')

class OnboardingBox extends PureComponent {
    render() {
        return (
            <React.Fragment>
                <div>{this.props.children}</div>

                <div className={styles.backgroundBlobWrapper}>
                    <div className={styles.backgroundBlob} />
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

// TODO styles.container could be turned into a component taking heading, image, content, onSubmit action
