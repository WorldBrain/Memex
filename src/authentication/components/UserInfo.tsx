import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { firebase } from 'src/util/firebase-app-initialized'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'
import Button from 'src/popup/components/Button'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
interface State {
    currentUser: AuthenticatedUserWithClaims
}

export class UserInfo extends React.Component<any, State> {
    handleLogout = () => {
        firebase.auth().signOut()
    }
    handleRefresh = async () => {
        await auth.refresh()
    }

    render() {
        const user: AuthenticatedUserWithClaims = this.props.currentUser
        return (
            <div className={''}>
                {user != null && (
                    <div>
                        <div>User: {user.displayName}</div>
                        <div>Email: {user.email}</div>
                        <div>Email Verified: {user.emailVerified}</div>
                        <div>UID: {user.uid}</div>

                        {user.claims != null &&
                        user.claims.subscriptions != null ? (
                            <div>Manage your subscription</div>
                        ) : (
                            <div> Upgrade </div>
                        )}
                        {user.claims != null &&
                            user.claims.features != null && (
                                <pre style={{ whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(user.claims.features)}
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
