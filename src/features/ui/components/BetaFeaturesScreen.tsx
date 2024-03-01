import { featuresBeta } from 'src/util/remote-functions-background'
import { TaskState } from 'ui-logic-core/lib/types'

import React from 'react'
import {
    TypographyHeadingBig,
    TypographyHeadingNormal,
    TypographyHeadingBigger,
    TypographyLink,
    TypographyTextNormal,
} from 'src/common-ui/components/design-library/typography'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { auth, subscription } from 'src/util/remote-functions-background'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

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
    loadState: TaskState
    displayName?: string
    newDisplayName?: string
    updateProfileState: TaskState
}

class BetaFeaturesScreen extends React.Component<
    AuthContextInterface & Props,
    State
> {
    state = {
        loadState: 'running',
        featureOptions: {},
        featureEnabled: {},
        loadingChargebee: false,
        updateProfileState: 'pristine',
    } as State

    componentDidMount = async () => {
        await this.refreshFeatures()
        this.getDisplayName()

        this.setState({
            loadState: 'success',
        })
    }

    async getDisplayName() {
        this.setState({ loadState: 'running' })
        try {
            const profile = await auth.getUserProfile()
            this.setState({
                loadState: 'success',
                displayName: profile?.displayName ?? undefined,
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }
    }

    updateDisplayName = async () => {
        this.setState({
            updateProfileState: 'running',
        })
        try {
            await auth.updateUserProfile({
                displayName: this.state.newDisplayName,
            })
            this.setState({
                updateProfileState: 'success',
                displayName: this.state.newDisplayName,
                newDisplayName: undefined,
            })
        } catch (e) {
            this.setState({
                updateProfileState: 'error',
            })
            throw e
        }
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
            'pdf-annotations': true,
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

    render() {
        return null
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
    toggleBetaFeatures: (val) => dispatch(resultsActs.setBetaFeatures(val)),
    showBetaFeatureNotifModal: () =>
        dispatch(
            show({
                modalId: 'BetaFeatureNotifModal',
                options: { initWithAuth: true },
            }),
        ),
}))(withCurrentUser(BetaFeaturesScreen))
