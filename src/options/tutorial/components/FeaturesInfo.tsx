import React, { PureComponent, ReactChild } from 'react'

const styles = require('./FeaturesInfo.css')

export interface Props {
    children: ReactChild[] | ReactChild
}

class FeaturesInfo extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.mainContainer}>
                <div className={styles.heading}>TUTORIAL</div>
                <div className={styles.featureContainer}>
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default FeaturesInfo
