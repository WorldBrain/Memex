import React, { Component } from 'react'
import { features, sync } from 'src/util/remote-functions-background'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
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
        const syncFeatureAllowed = true
        // const syncFeatureAllowed = this.props.authorizedFeatures.includes('sync') // TODO: Uncomment this to show Sync button based on subscription
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
            <SyncNowOverlayPane
                onClickSync={this.handleOnClickSync}
                isSyncing={this.state.isSyncing}
            />
        )
    }
}

export default withCurrentUser(SyncNowOverlayPaneContainer)
