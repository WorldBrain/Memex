import * as React from 'react'
import { Helmet } from 'react-helmet'
import Button from 'src/popup/components/Button'
import { UserSubscription } from 'src/authentication/components/user-subscription'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/auth'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { auth } from 'src/util/remote-functions-background'

const chargeBeeScriptSource = 'https://js.chargebee.com/v2/chargebee.js'

interface Props {
    currentUser: any
    setUser: any
}

interface State {
    currentUser: any
}

class Authentication extends React.PureComponent<Props, State> {
    state = { currentUser: null }

    componentDidMount = async () => {
        this.setState({ currentUser: await auth.getUser() })

        const authEvents = getRemoteEventEmitter('auth')
        authEvents.addListener('onAuthStateChanged', _user => {
            console.log('Updating user from event fired by background script')
            this.setState({ currentUser: _user })
        })
    }

    render() {
        return (
            <div className={''}>
                {this.state.currentUser == null && <SignInScreen />}
                {this.state.currentUser != null && <UserInfo />}
            </div>
        )
    }
}
export default Authentication

class Subscription extends React.PureComponent {
    chargebeeInstance: any
    userSubscription: UserSubscription

    _initChargebee = (): void => {
        if (this.chargebeeInstance != null) {
            return
        }
        if (window['Chargebee'] == null) {
            return console.error(
                'Could not load payment provider as external script is not currently loaded.',
            )
        }
        this.chargebeeInstance = window['Chargebee'].init({
            site: 'wbstaging-test',
        })
        this.userSubscription = new UserSubscription(this.chargebeeInstance)
    }

    openPortal = async () => {
        this._initChargebee()
        return this.userSubscription.manageUserSubscription({
            planId: 'cbdemo_grow',
        })
    }

    openCheckout = async () => {
        this._initChargebee()
        return this.userSubscription.checkoutUserSubscription({
            planId: 'cbdemo_grow',
        })
    }

    render() {
        return (
            <div className={''}>
                <Helmet>
                    <script src={chargeBeeScriptSource} />
                </Helmet>
                <h1 className={''}>Subscription (Test)</h1>
                <Button onClick={_ => this.openCheckout()}>
                    Subscribe Monthly
                </Button>
                <Button onClick={_ => this.openCheckout()}>
                    Subscribe Yearly
                </Button>

                <br />
                <Button onClick={_ => this.openPortal()}>
                    Manage Existing Subscription
                </Button>
            </div>
        )
    }
}

class UserInfo extends React.PureComponent {
    state = { currentUser: null }

    componentDidMount = async () => {
        const user = await auth.getUser()
        this.setState({ currentUser: user })

        const authEvents = getRemoteEventEmitter('auth')
        authEvents.addListener('onAuthStateChanged', _user => {
            this.setState({ currentUser: _user })
        })
    }

    handleLogout = () => {
        firebase.auth().signOut()
    }
    handleRefresh = async () => {
        await auth.refresh()
        await auth.checkValidPlan('pro')
        // todo: implement check has access to feature 'backup'
    }

    render() {
        return (
            <div className={''}>
                <pre>{JSON.stringify(this.state.currentUser)}</pre>
                <span>Subscribed to pro plan:</span>
                <Subscription />
                <span onClick={this.handleLogout}>Logout</span>
                <span onClick={this.handleRefresh}>refresh</span>
            </div>
        )
    }
}

class SignInScreen extends React.Component {
    render = () => {
        return (
            <StyledFirebaseAuth
                uiConfig={{
                    signInFlow: 'popup',
                    signInOptions: [
                        firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    ],
                    callbacks: {
                        // Avoid redirects after sign-in.
                        signInSuccessWithAuthResult: () => false,
                    },
                }}
                firebaseAuth={firebase.auth()}
            />
        )
    }
}
