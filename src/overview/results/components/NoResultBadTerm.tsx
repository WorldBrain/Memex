import React, { ReactChild, PureComponent } from 'react'

const styles = require('./NoResult.css')

export interface Props {
    monthlyUpdatesUrl?: string
    roomToImproveUrl?: string
    reportProbUrl?: string
    title?: string
}

class NoResultBadTerm extends PureComponent<Props> {
    static defaultProps = {
        title: 'No Results',
    }

    render() {
        return (
            <div>
                <div className={styles.title}>{this.props.title}</div>
                <div className={styles.subtitle}>{this.props.children}</div>
            </div>
        )
    }
}

export default NoResultBadTerm
