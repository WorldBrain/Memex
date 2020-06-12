import { featuresBeta } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'
import {
    TypographyHeadingBig,
    TypographySubHeading,
    TypographyText,
    TypographyHeadingSmall,
    TypographyHeadingNormal,
    TypographyHeadingBigger,
    TypographyLink,
} from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { PrimaryButton } from 'src/common-ui/components/primary-button'

const settingsStyle = require('src/options/settings/components/settings.css')
import {
    UserBetaFeature,
    UserBetaFeatureId,
} from 'src/features/background/feature-beta'
import { acts as resultsActs } from 'src/overview/results'

interface Props {
    showSubscriptionModal: () => void
    toggleBetaFeatures: (val: boolean) => void
}

interface State {
    featureOptions: UserBetaFeature[]
    featureEnabled: { [key in UserBetaFeatureId]: boolean }
}

class BetaFeaturesScreen extends React.Component<
    AuthContextInterface & Props,
    State
> {
    state = {
        featureOptions: {},
        featureEnabled: {},
    } as State

    componentDidMount = async () => {
        await this.refreshFeatures()
    }

    refreshFeatures = async () => {
        const featureOptions = await featuresBeta.getFeatures()
        const featureEnabled = {
            'copy-paster': true,
            reader: false,
            'pdf-annotations': false,
        }
        Object.values(featureOptions).forEach(
            (f) => (featureEnabled[f.id] = f.enabled),
        )
        this.setState({ featureOptions, featureEnabled })
        this.props.currentUser?.authorizedFeatures?.includes('beta') &&
            this.props.toggleBetaFeatures(featureEnabled['copy-paster'])
    }

    toggleFeature = (feature) => async () => {
        await featuresBeta.toggleFeature(feature)
        await this.refreshFeatures()
    }

    render() {
        return (
            <div>
                <section className={settingsStyle.section}>
                    <div className={settingsStyle.titleBox}>
                        <div className={settingsStyle.titleArea}>
                            <TypographyHeadingBigger>
                                Beta Features
                            </TypographyHeadingBigger>

                            {this.props.currentUser?.authorizedFeatures?.includes(
                                'beta',
                            ) ? (
                                <div>
                                    <TypographyText>
                                        Thanks so much for your support. If you
                                        run into issues with Beta features,{' '}
                                        <a href="https://community.worldbrain.io">
                                            let us know
                                        </a>
                                    </TypographyText>
                                </div>
                            ) : (
                                <div>
                                    <TypographyText>
                                        To access beta features, please
                                        <TypographyLink
                                            onClick={
                                                this.props.showSubscriptionModal
                                            }
                                        >
                                            support us with the pioneer upgrade.
                                        </TypographyLink>
                                    </TypographyText>
                                </div>
                            )}
                        </div>
                        <PrimaryButton
                            onClick={() =>
                                window.open(
                                    'https://worldbrain.io/feedback/betafeatures',
                                )
                            }
                        >
                            Send Feedback
                        </PrimaryButton>
                    </div>
                    <div className={settingsStyle.titleSpace}>
                    <TypographyHeadingBig>
                            Available Beta Features
                    </TypographyHeadingBig>
                    </div>
                    {Object.values(this.state.featureOptions)?.map(
                        (feature) => (
                            <div>
                                {feature.available === true && (
                                    <section className={settingsStyle.listItem}>
                                        <div
                                            className={
                                                settingsStyle.featureBlock
                                            }
                                            key={`key-beta-${feature.id}`}
                                        >
                                            <div
                                                className={
                                                    settingsStyle.featureContent
                                                }
                                            >
                                                <TypographyHeadingNormal>
                                                    {feature.name}
                                                </TypographyHeadingNormal>
                                                <TypographyText>
                                                    {feature.description}
                                                </TypographyText>
                                            </div>
                                            <div
                                                className={
                                                    settingsStyle.buttonArea
                                                }
                                            >
                                                <div
                                                    className={
                                                        settingsStyle.readMoreButton
                                                    }
                                                    onClick={() => {
                                                        window.open(
                                                            feature.link,
                                                        )
                                                    }}
                                                >
                                                    Read More
                                                </div>
                                                {this.props.currentUser?.authorizedFeatures?.includes(
                                                    'beta',
                                                ) ? (
                                                    <ToggleSwitch
                                                        isChecked={
                                                            this.state
                                                                .featureEnabled[
                                                                feature.id
                                                            ]
                                                        }
                                                        onChange={this.toggleFeature(
                                                            feature.id,
                                                        )}
                                                    />
                                                ) : (
                                                    <ToggleSwitch
                                                        isChecked={false}
                                                        onChange={
                                                            this.props
                                                                .showSubscriptionModal
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        ),
                    )}
                    <TypographyHeadingBig>In Development</TypographyHeadingBig>
                    {Object.values(this.state.featureOptions)?.map(
                        (feature) => (
                            <div>
                                {!feature.available && (
                                    <div>
                                        <section
                                            className={settingsStyle.listItem}
                                        >
                                            <div
                                                className={
                                                    settingsStyle.featureBlock
                                                }
                                                key={`key-beta-${feature.id}`}
                                            >
                                                <div
                                                    className={
                                                        settingsStyle.featureContent
                                                    }
                                                >
                                                    <TypographyHeadingNormal>
                                                        {feature.name}
                                                    </TypographyHeadingNormal>
                                                    <TypographyText>
                                                        {feature.description}
                                                    </TypographyText>
                                                </div>
                                                <div
                                                    className={
                                                        settingsStyle.buttonArea
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            settingsStyle.readMoreButton
                                                        }
                                                        onClick={() => {
                                                            window.open(
                                                                feature.link,
                                                            )
                                                        }}
                                                    >
                                                        Read More
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        ),
                    )}
                </section>
            </div>
        )
    }
}
export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
    toggleBetaFeatures: (val) => dispatch(resultsActs.setBetaFeatures(val)),
}))(withCurrentUser(BetaFeaturesScreen))
