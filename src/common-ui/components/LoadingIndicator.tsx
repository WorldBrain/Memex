import React, { PureComponent } from 'react'

const styles = require('./LoadingIndicator.css')

export interface Props {
    className?: string
}

class LoadingIndicator extends PureComponent<Props> {
    render() {
        return <div className={styles.loader} />
    }
}

export default LoadingIndicator
