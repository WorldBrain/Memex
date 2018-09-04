import React, { PureComponent, MouseEventHandler } from 'react'
import cx from 'classnames'

const styles = require('./Onboarding.css')

export interface Props {
    onFinish: MouseEventHandler
}

class OnboardingMsg extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.messageContainer}>
                <div className={styles.heading}>Welcome to your memex</div>
                <div className={styles.subheading}>
                    Explore its key features
                </div>
                <div className={styles.or}>OR</div>
                <a
                    className={cx(styles.choiceBtn, styles.startBtn)}
                    type="button"
                    onClick={this.props.onFinish}
                >
                    <div className={styles.getStatedBtn}> GET STARTED </div>
                    <div className={styles.letsGoBtn}> LET'S GOOO! </div>
                </a>
            </div>
        )
    }
}

export default OnboardingMsg
