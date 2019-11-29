import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getFirebase } from 'src/util/firebase-app-initialized'
import Button from 'src/popup/components/Button'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { SubscribeModal } from 'src/authentication/components/Subscription/SubscribeModal'
interface State {
    showSubscriptionModal: boolean
}

export class UserInfo extends React.Component<UserProps, State> {
    state = { showSubscriptionModal: false }

    handleLogout = () => {
        getFirebase()
            .auth()
            .signOut()
    }
    handleRefresh = async () => {
        await auth.refreshUserInfo()
    }

    hideSubscriptionModal = () => {
        this.setState({ showSubscriptionModal: false })
    }
    showSubscriptionModal = () => this.setState({ showSubscriptionModal: true })

    render() {
        const user = this.props.currentUser
        const features = this.props.authorizedFeatures
        return (
            <div className={''}>
                {this.state.showSubscriptionModal === true && (
                    <SubscribeModal onClose={this.hideSubscriptionModal} />
                )}
                {user != null && (
                    <div>
                        <div>User: {user.displayName}</div>
                        <div>Email: {user.email}</div>
                        <div>Email Verified: {user.emailVerified}</div>
                        <div>UID: {user.id}</div>

                        <Button onClick={this.showSubscriptionModal}>
                            Subscriptions
                        </Button>

                        {features != null && (
                            <pre style={{ whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(features)}
                            </pre>
                        )}

                        <Button
                            className={'button'}
                            onClick={this.handleLogout}
                        >
                            Logout
                        </Button>
                        <Button
                            className={'button'}
                            onClick={this.handleRefresh}
                        >
                            refresh
                        </Button>
                    </div>
                )}
            </div>
        )
    }
}
export default withCurrentUser(UserInfo)
