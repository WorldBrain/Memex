import React, { PureComponent, MouseEventHandler } from 'react'
import cx from 'classnames'

const styles = require('./OnboardingMsg.css')

export interface Props {
    onFinish: MouseEventHandler
}

class OnboardingMsg extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.messageContainer}>
                <div className={styles.heading}>Welcome!</div>
                <div className={styles.subheading}>
                    Let me show you what your <b>memex</b> can do for you.
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
