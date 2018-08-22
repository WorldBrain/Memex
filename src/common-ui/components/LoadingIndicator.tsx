import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./LoadingIndicator.css')

export interface Props {
    className?: string
}

class LoadingIndicator extends PureComponent<Props> {
    render() {
        return (
            <div className={cx(styles.container, this.props.className)}>
                <span className={cx(styles.dotone, styles.dot)} />
                <span className={cx(styles.dottwo, styles.dot)} />
                <span className={cx(styles.dotthree, styles.dot)} />
            </div>
        )
    }
}

export default LoadingIndicator
