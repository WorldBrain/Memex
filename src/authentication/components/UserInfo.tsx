import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { firebase } from 'src/util/firebase-app-initialized'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'
import Button from 'src/popup/components/Button'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { SubscribeModal } from 'src/authentication/components/Subscription/SubscribeModal'
interface State {
    showSubscriptionModal: boolean
}

export class UserInfo extends React.Component<any, State> {
    state = { showSubscriptionModal: false }

    handleLogout = () => {
        firebase.auth().signOut()
    }
    handleRefresh = async () => {
        await auth.refresh()
    }

    hideSubscriptionModal = () => {
        this.setState({ showSubscriptionModal: false })
    }
    showSubscriptionModal = () => this.setState({ showSubscriptionModal: true })

    render() {
        const user: AuthenticatedUserWithClaims = this.props.currentUser
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
                        <div>UID: {user.uid}</div>

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
