import React, { ReactChild, PureComponent } from 'react'

const styles = require('./NoResult.css')

export interface Props {
    monthlyUpdatesUrl?: string
    roomToImproveUrl?: string
    reportProbUrl?: string
    title?: string
    children: ReactChild
}

class NoResultBadTerm extends PureComponent<Props> {
    static defaultProps = {
        roomToImproveUrl:
            'https://worldbrain.helprace.com/i23-known-limitations-of-searching',
        reportProbUrl: 'https://worldbrain.helprace.com/',
        monthlyUpdatesUrl: 'https://eepurl.com/dkmJfr',
        title: 'No Results',
    }

    render() {
        return (
            <div>
                <div className={styles.title}>{this.props.title}</div>
                <div className={styles.subtitle}>
                    {this.props.children}
                    <br />
                    <br />
                </div>
                <div className={styles.btnBox}>
                    <span className={styles.subsubtitle}>
                            Not what you expected?
                    </span>
                    <a target="_new" href={this.props.reportProbUrl}>
                        <button className={styles.button}>
                            Report a Problem
                        </button>
                    </a>
                </div>
            </div>
        )
    }
}

export default NoResultBadTerm
