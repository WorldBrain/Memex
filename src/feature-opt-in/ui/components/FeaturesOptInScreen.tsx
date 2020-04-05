import { features } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'

export class FeaturesOptInScreen extends React.Component<any, any> {
    state = { featureOptions: {} }

    componentDidMount = async () => {
        await this.refreshFeatures()
    }

    refreshFeatures = async () => {
        const featureOptions = await features.getFeatures()
        this.setState({ featureOptions })
    }

    toggleFeature = feature => {
        return () => {
            features.toggleFeature(feature)
            this.refreshFeatures()
        }
    }

    render() {
        return (
            <div>
                {Object.keys(this.state.featureOptions).map(feature => (
                    <div key={`key-opt-in-${feature}`}>
                        <span>{feature}</span>
                        <ToggleSwitch
                            isChecked={this.state.featureOptions[feature]}
                            onChange={this.toggleFeature(feature)}
                        />
                    </div>
                ))}
            </div>
        )
    }
}
