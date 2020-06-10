import { featuresBeta } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'
import {
    TypographyHeadingBig,
    TypographySubHeading,
    TypographyText,
} from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

import settingsStyle from 'src/options/settings/components/settings.css'
import { UserBetaFeature } from 'src/features/background/feature-beta'

interface Props {
    showSubscriptionModal: () => void
}

interface State {
    featureOptions: UserBetaFeature[]
}

class BetaFeaturesScreen extends React.Component<
    AuthContextInterface & Props,
    State
> {
    state = { featureOptions: {} as UserBetaFeature[] }

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
                            Thanks so much for your support. If you run into
                            issues with Beta features,{' '}
                            <a href="https://community.worldbrain.io">
                                let us know
                            </a>
                        </div>
                    ) : (
                        <div>
                            To access beta features, please subscribe to be
                            pioneer.
                        </div>
                    )}
                </section>
                {Object.values(this.state.featureOptions)?.map((feature) => (
                    <section className={settingsStyle.section}>
                        <div
                            className={settingsStyle.featureBlock}
                            key={`key-beta-${feature.id}`}
                        >
                            <TypographySubHeading>
                                {feature.name}
                            </TypographySubHeading>
                            <TypographyText>
                                {feature.description}
                            </TypographyText>

                            <div>{feature.link}</div>

                            {this.props.currentUser?.authorizedFeatures?.includes(
                                'beta',
                            ) ? (
                                <ToggleSwitch
                                    isChecked={
                                        this.state.featureOptions[feature.id]
                                    }
                                    onChange={this.toggleFeature(feature.id)}
                                />
                            ) : (
                                <ToggleSwitch
                                    isChecked={
                                        this.state.featureOptions[feature.id]
                                    }
                                    onChange={this.props.showSubscriptionModal}
                                />
                            )}
                        </div>
                    </section>
                ))}
            </div>
        )
    }
}
export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(BetaFeaturesScreen))
