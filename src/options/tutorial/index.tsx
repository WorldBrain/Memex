import React, { PureComponent } from 'react'
import browser, { Tabs } from 'webextension-polyfill'

import FeaturesInfo from './components/FeaturesInfo'
import FeatureInfo from './components/FeatureInfo'
import { FEATURES_INFO } from './constants'
export interface Props {
    tabs: Tabs.Static
}

class Tutorial extends PureComponent<Props> {
    static defaultProps: Pick<Props, 'tabs'> = {
        tabs: browser.tabs,
    }

    private openNewUrl = (url) => () => {
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
