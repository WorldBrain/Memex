import React, { Component } from 'react'

import { remoteFunction } from '../../util/webextensionRPC'

import FeaturesInfo from './components/FeaturesInfo'
import FeatureInfo from '../../overview/onboarding/components/FeatureInfo'
import { FEATURES_INFO } from '../../overview/onboarding/constants'

class Tutorial extends Component {
    openNewUrl = url => {
        remoteFunction('processEvent')({
            type: 'openURLFeature',
        })

        window.open(url, '_blank')
    }

    renderFeaturesInfo = () => {
        return FEATURES_INFO.map((feature, index) => (
            <FeatureInfo
                key={index}
                heading={feature.heading}
                subheading={feature.subheading}
                handleClick={() => this.openNewUrl(feature.url)}
            />
        ))
    }

    render() {
        return <FeaturesInfo>{this.renderFeaturesInfo()}</FeaturesInfo>
    }
}

export default Tutorial
