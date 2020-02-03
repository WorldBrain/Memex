import SyncDevicesPane from 'src/sync/components/device-list/SyncDevicesPane'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import React from 'react'

export default class SyncSettingsScreen extends React.Component<
    {},
    { subscribeModal: boolean }
> {
    state = { subscribeModal: false }

    closeSubscriptionModal = () => {
        this.setState({ subscribeModal: false })
    }

    render() {
        return (
            <div>
                <SyncDevicesPane />
                {this.state.subscribeModal && (
                    <SubscribeModal onClose={this.closeSubscriptionModal} />
                )}
            </div>
        )
    }
}
