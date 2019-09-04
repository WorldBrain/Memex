import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./onboarding-box.css')

interface Props {
    isChecked?: boolean
}

export default class Progress extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <div>
                    <div
                        className={cx(styles.progressDot, {
                            [styles.progressDotSeen]: this.props.isChecked,
                        })}
                    />
                </div>
            </React.Fragment>
        )
    }
}
