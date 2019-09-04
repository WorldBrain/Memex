import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./onboarding-box.css')

interface Props {
    isSeen?: boolean
}

export default class ProgressDot extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <span
                    className={cx(styles.progressDot, {
                        [styles.progressDotSeen]: this.props.isSeen,
                    })}
                />
            </React.Fragment>
        )
    }
}
