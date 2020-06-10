import { featuresBeta } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'
import { TypographyHeadingBig, TypographySubHeading } from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

import settingsStyle from 'src/options/settings/components/settings.css'

interface Props {
    showSubscriptionModal: () => void
}

class BetaFeaturesScreen extends React.Component<AuthContextInterface & Props, any> {
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
                <section className={settingsStyle.section}>
                    <TypographyHeadingBig>Beta Features</TypographyHeadingBig>

                    {this.props.currentUser?.authorizedFeatures?.includes(
                        'beta',
                    ) ? (
                        <div>
                            Thanks so much for your support. If you run into issues with Beta features, <a href="https://community.worldbrain.io">let us know</a>
                        </div>
                    ) : (
                        <div>
                            To access beta features, please subscribe to be pioneer.
                        </div>
                    )} 
                </section>           
                    {Object.keys(this.state.featureOptions).map(
                                (feature) => (
                                    <section className={settingsStyle.section}>
                                        <div className={settingsStyle.featureBlock} key={`key-beta-${feature}`}>
                                            <TypographySubHeading>{feature}</TypographySubHeading>
                                            {this.props.currentUser?.authorizedFeatures?.includes(
                                                'beta',
                                            ) ? (
                                            <ToggleSwitch
                                                isChecked={
                                                    this.state.featureOptions[feature]
                                                }
                                                onChange={this.toggleFeature(feature)}
                                                />
                                            ):(
                                                <ToggleSwitch
                                                isChecked={
                                                    this.state.featureOptions[feature]
                                                }
                                                onChange={this.props.showSubscriptionModal}
                                                />
                                            )}
                                        </div>
                                    </section>
                                ),
                    )}
            </div>
        )
    }
}
export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(BetaFeaturesScreen))
