import { featuresBeta } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'
import { TypographyHeadingPage } from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'

class BetaFeaturesScreen extends React.Component<AuthContextInterface, any> {
    state = { featureOptions: {} }

    componentDidMount = async () => {
        await this.refreshFeatures()
    }

    refreshFeatures = async () => {
        const featureOptions = await featuresBeta.getFeatures()
        this.setState({ featureOptions })
    }

    toggleFeature = (feature) => {
        return () => {
            featuresBeta.toggleFeature(feature)
            this.refreshFeatures()
        }
    }

    render() {
        return (
            <div>
                <TypographyHeadingPage>Beta Features</TypographyHeadingPage>

                {this.props.currentUser?.authorizedFeatures?.includes(
                    'beta',
                ) ? (
                    <div>
                        {Object.keys(this.state.featureOptions).map(
                            (feature) => (
                                <div key={`key-beta-${feature}`}>
                                    <span>{feature}</span>
                                    <ToggleSwitch
                                        isChecked={
                                            this.state.featureOptions[feature]
                                        }
                                        onChange={this.toggleFeature(feature)}
                                    />
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <div>
                        {
                            'In order to access beta features, please subscribe to be pioneer.'
                        }
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(BetaFeaturesScreen)
