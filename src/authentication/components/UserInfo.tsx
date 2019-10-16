import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { firebase } from 'src/util/firebase-app-initialized'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'
import Button from 'src/popup/components/Button'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'
interface State {
    currentUser: AuthenticatedUserWithClaims
}
export class UserInfo extends React.Component<any, State> {
    state = { currentUser: null }

    componentDidMount = async () => {
        this.setState({ currentUser: await auth.getUser() })

        const authEvents = getRemoteEventEmitter('auth')
        authEvents.addListener('onAuthStateChanged', async user => {
            this.setState({ currentUser: user })
        })
    }

    componentWillUnmount(): void {
        // todo: remove event listener, but let's abstract this whole listening lifecycle to context or redux
    }

    handleLogout = () => {
        firebase.auth().signOut()
    }
    handleRefresh = async () => {
        await auth.refresh()
    }

    render() {
        const user: AuthenticatedUserWithClaims = this.state.currentUser
        console.log('Render with user:', user)
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
