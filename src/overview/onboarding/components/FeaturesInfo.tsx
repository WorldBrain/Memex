import React, { PureComponent, ReactChild } from 'react'

const styles = require('./FeaturesInfo.css')

export interface Props {
    children: ReactChild[] | ReactChild
    optInManager: JSX.Element
}

class FeaturesInfo extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.rightContainer}>
                <div className={styles.featureContainer}>
                    {this.props.children}
                </div>
                <div className={styles.optInContainer}>
                    {this.props.optInManager}
                </div>
            </div>
        )
    }
}

export default FeaturesInfo
