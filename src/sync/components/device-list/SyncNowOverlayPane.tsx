import React, { Component } from 'react'
import { features, sync } from 'src/util/remote-functions-background'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'
interface Props {
    onClickSync: () => void
    isSyncing: boolean
}
const settingsStyle = require('src/options/settings/components/settings.css')

export class SyncNowOverlayPane extends Component<Props> {
    renderSyncNowButton() {
        if (this.props.isSyncing) {
            return (
                <PrimaryAction 
                    disabled={true} 
                    onClick={() => false}
                    label={'Syncing....'}
                />
            )
        } else {
            return (
                <PrimaryAction 
                    onClick={this.props.onClickSync}
                    label={'Sync Now'}
                />
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
                <div className={settingsStyle.buttonArea}>
                <div className={settingsStyle.sectionTitle}>
                    Sync Status
                </div>
                <SyncNowOverlayPane
                        onClickSync={this.handleOnClickSync}
                        isSyncing={this.state.isSyncing}
                />
                </div>
                {this.state.isSyncing ? (
                    <div className={settingsStyle.infoText}>
                        Sync in Progress
                    </div>
                ):(
                    <div className={settingsStyle.infoText}>
                        Not synced yet
                    </div>
                )}
                {this.state.syncError && (
                    <div className={settingsStyle.infoText}>
                        Error while syncing
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(SyncNowOverlayPaneContainer)
