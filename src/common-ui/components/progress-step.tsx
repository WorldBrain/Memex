import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./progress-step.css')

interface Props {
    isSeen?: boolean
}

export default class ProgressStep extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <span
                    className={cx(styles.progressStep, {
                        [styles.progressStepSeen]: this.props.isSeen,
                    })}
                />
            </React.Fragment>
        )
    }
}
