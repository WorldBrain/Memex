import React, { Component } from 'react'
import { features, sync } from 'src/util/remote-functions-background'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'
interface Props {
    onClickSync: () => void
    isSyncing: boolean
}

export class SyncNowOverlayPane extends Component<Props> {
    renderSyncNowButton() {
        if (this.props.isSyncing) {
            return (
                <PrimaryButton disabled={true} onClick={() => false}>
                    Syncing....
                </PrimaryButton>
            )
        } else {
            return (
                <PrimaryButton onClick={this.props.onClickSync}>
                    Sync Now
                </PrimaryButton>
            )
        }
    }

    renderSyncResults() {}

    render() {
        return (
            <div>
                {this.renderSyncNowButton()}
                {this.renderSyncResults()}
            </div>
        )
    }
}

interface ContainerProps {}
interface ContainerState {
    showSync: boolean
    syncResults: any
    syncError: any
    isSyncing: boolean
}
export class SyncNowOverlayPaneContainer extends Component<
    ContainerProps & UserProps,
    ContainerState
> {
    state = {
        showSync: false,
        syncResults: [],
        syncError: null,
        isSyncing: false,
    }

    async componentDidMount() {
        const syncFeatureEnabled = await features.getFeature('Sync')
        const syncFeatureAllowed = this.props.authorizedFeatures.includes(
            'sync',
        )
        this.setState({ showSync: syncFeatureAllowed && syncFeatureEnabled })
    }

    async componentDidUpdate() {
        const syncFeatureEnabled = await features.getFeature('Sync')
        const syncFeatureAllowed = this.props.authorizedFeatures.includes(
            'sync',
        )
        this.setState({ showSync: syncFeatureAllowed && syncFeatureEnabled })
    }

    handleOnClickSync = async () => {
        this.setState({ isSyncing: true })
        const syncing = await sync.forceIncrementalSync()
        // console.log("UI: Sync completed with",syncing)
        this.setState({ isSyncing: false })
        window.location.reload()
    }

    render() {
        if (!this.state.showSync) {
            return null
        }

        return (
            <div>
                <WhiteSpacer20 />
                <SyncNowOverlayPane
                    onClickSync={this.handleOnClickSync}
                    isSyncing={this.state.isSyncing}
                />
            </div>
        )
    }
}

export default withCurrentUser(SyncNowOverlayPaneContainer)
