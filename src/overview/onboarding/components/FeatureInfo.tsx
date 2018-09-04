import React, { PureComponent, MouseEventHandler } from 'react'

const styles = require('./FeatureInfo.css')

export interface Props {
    heading: string
    subheading: string
    handleClick: MouseEventHandler
}

class FeatureInfo extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.infoContainer}>
                <a
                    onClick={this.props.handleClick}
                    className={styles.featureLink}
                >
                    <div className={styles.headingSubheading}>
                        <div className={styles.featureHeading}>
                            {this.props.heading}
                        </div>
                        <div className={styles.featureSubheading}>
                            {this.props.subheading}
                        </div>
                    </div>
                    <div className={styles.arrow}>
                        <img src="/img/arrow.svg" />
                    </div>
                </a>
            </div>
        )
    }
}

export default FeatureInfo
