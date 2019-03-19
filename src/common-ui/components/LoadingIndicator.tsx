import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./LoadingIndicator.css')

export interface Props {
    className?: string
}

class LoadingIndicator extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.ldsEllipsis}>
            <div />
            <div />
            <div />
            <div />
            </div>
        )
    }
}

export default LoadingIndicator
