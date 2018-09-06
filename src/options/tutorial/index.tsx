import React, { PureComponent } from 'react'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../../util/webextensionRPC'

import FeaturesInfo from './components/FeaturesInfo'
import FeatureInfo from '../../overview/onboarding/components/FeatureInfo'
import { FEATURES_INFO } from '../../overview/onboarding/constants'

export interface Props {
    tabs: Tabs.Static
}

class Tutorial extends PureComponent<Props> {
    static defaultProps: Pick<Props, 'tabs'> = {
        tabs: browser.tabs,
    }

    private processEventRPC = remoteFunction('processEvent')

    private openNewUrl = url => () => {
        this.processEventRPC({ type: 'openURLFeature' })

        this.props.tabs.create({ url })
    }

    renderFeaturesInfo = () => {
        return FEATURES_INFO.map((feature, index) => (
            <FeatureInfo
                key={index}
                heading={feature.heading}
                subheading={feature.subheading}
                handleClick={this.openNewUrl(feature.url)}
            />
        ))
    }

    render() {
        return <FeaturesInfo>{this.renderFeaturesInfo()}</FeaturesInfo>
    }
}

export default Tutorial
