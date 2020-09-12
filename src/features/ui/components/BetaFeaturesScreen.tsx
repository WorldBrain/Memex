import { featuresBeta } from 'src/util/remote-functions-background'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'
import React from 'react'
import {
    TypographyHeadingBig,
    TypographyHeadingNormal,
    TypographyHeadingBigger,
    TypographyLink,
    TypographyTextSmall,
    TypographyTextNormal,
} from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { auth, subscription } from 'src/util/remote-functions-background'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

const settingsStyle = require('src/options/settings/components/settings.css')
import {
    UserBetaFeature,
    UserBetaFeatureId,
} from 'src/features/background/feature-beta'
import { acts as resultsActs } from 'src/overview/results'

interface Props {
    showSubscriptionModal: () => void
    toggleBetaFeatures: (val: boolean) => void
    showBetaFeatureNotifModal: () => void
}

interface State {
    featureOptions: UserBetaFeature[]
    featureEnabled: { [key in UserBetaFeatureId]: boolean }
    loadingChargebee: boolean
}

class BetaFeaturesScreen extends React.Component<
    AuthContextInterface & Props,
    State
> {
    state = {
        featureOptions: {},
        featureEnabled: {},
        loadingChargebee: false,
    } as State

    componentDidMount = async () => {
        await this.refreshFeatures()
    }

    openPortal = async () => {
        this.setState({
            loadingChargebee: true,
        })
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
        this.setState({
            loadingChargebee: false,
        })
    }

    refreshFeatures = async () => {
        const featureOptions = await featuresBeta.getFeatures()
        const featureEnabled = {
            'sharing-collections': true,
            'pdf-annotations': false,
        }
        Object.values(featureOptions).forEach(
            (f) => (featureEnabled[f.id] = f.enabled),
        )
        this.setState({ featureOptions, featureEnabled })
    }

    toggleFeature = (feature) => async () => {
        await featuresBeta.toggleFeature(feature)
        await this.refreshFeatures()
    }

    private renderUpgradeBtn() {
        if (this.state.loadingChargebee) {
            return (
                <PrimaryAction
                    label={<LoadingIndicator />}
                    onClick={undefined}
                />
            )
        }

        return (
            <PrimaryAction
                label="Request Access"
                onClick={() => {
                        window.open(
                            'https://worldbrain.io/beta',
                        )
                    }
                }
            />
        )
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
                                <TypographyTextNormal>
                                    You're signed up for using the beta features.<br/>
                                </TypographyTextNormal>
                            ) : (
                                <div>
                                    <TypographyTextNormal>
                                        Access beta features by
                                        <TypographyLink
                                            onClick={() => {
                                                window.open(
                                                    'https://worldbrain.io/beta',
                                                )
                                            }}
                                        >
                                            requesting free access via a wait list.
                                        </TypographyLink>
                                    </TypographyTextNormal>
                                </div>
                            )}
                        </div>
                        <div className={settingsStyle.buttonBox}>
                            {!this.props.currentUser?.authorizedFeatures?.includes(
                                'beta',
                            ) && (
                                this.renderUpgradeBtn()
                            )}
                            <SecondaryAction
                                onClick={() =>
                                    window.open(
                                        'https://worldbrain.io/feedback',
                                    )
                                }
                                label={'Send Feedback'}
                            />
                        </div>
                    </div>
                </section>
                <section>
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
                                                <TypographyTextSmall>
                                                    {feature.description}
                                                </TypographyTextSmall>
                                            </div>
                                            <div
                                                className={
                                                    settingsStyle.buttonArea
                                                }
                                            >
                                            {feature.link &&
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
                                                }
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
                                                                .showBetaFeatureNotifModal
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
                                                    <TypographyTextSmall>
                                                        {feature.description}
                                                    </TypographyTextSmall>
                                                </div>
                                                <div
                                                    className={
                                                        settingsStyle.buttonArea
                                                    }
                                                >
                                                {feature.link &&
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
                                                }
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
    showBetaFeatureNotifModal: () =>
        dispatch(show({ modalId: 'BetaFeatureNotifModal' })),
}))(withCurrentUser(BetaFeaturesScreen))
