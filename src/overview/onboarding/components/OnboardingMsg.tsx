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
                <img
                    className={styles.introImage}
                    src={'/img/memex_beta_logo.png'}
                />
                <div className={styles.subheading}>
                    Explore your new abilities.
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
