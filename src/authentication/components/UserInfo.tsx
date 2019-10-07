import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { firebase } from 'src/util/firebase-app-initialized'
import { Subscription } from 'src/authentication/components/Subscription'
import Button from 'src/popup/components/Button'

export class UserInfo extends React.PureComponent {
    state = { currentUser: null, subscribed: false }

    componentDidMount = async () => {
        const user = await auth.getUser()
        const subscribed = await auth.hasValidPlan('pro')
        this.setState({ currentUser: user, subscribed })

        const authEvents = getRemoteEventEmitter('auth')
        authEvents.addListener('onAuthStateChanged', async _user => {
            const _subscribed = await auth.hasValidPlan('pro')
            this.setState({
                currentUser: _user,
                subscribed: _subscribed,
            })
        })
    }

    handleLogout = () => {
        firebase.auth().signOut()
    }
    handleRefresh = async () => {
        await auth.refresh()
        // todo: implement check has access to feature 'backup'
    }

    render() {
        return (
            <div className={''}>
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(this.state.currentUser)}
                </pre>

                {this.state.subscribed && <span>Subscribed to pro plan:</span>}
                <Subscription user={this.state.currentUser} />
                <Button className={'button'} onClick={this.handleLogout}>
                    Logout
                </Button>
                <Button className={'button'} onClick={this.handleRefresh}>
                    refresh
                </Button>
            </div>
        )
    }
}
