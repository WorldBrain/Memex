import * as React from 'react'
const chargeBeeScriptSource = 'https://js.chargebee.com/v2/chargebee.js'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'

interface Props {
    onClose: () => void
}
interface State {
    currentUser: AuthenticatedUserWithClaims
}

export class Subscribe extends React.PureComponent<Props, State> {
    state = { currentUser: null }

    componentDidMount = async () => {
        this.setState({ currentUser: await auth.getUser() })
        const authEvents = getRemoteEventEmitter('auth')
        authEvents.addListener('onAuthStateChanged', _user => {
            this.setState({ currentUser: _user })
        })
    }

    render() {
        return (
            <div className={''}>
                {this.state.currentUser == null && (
                    <div>
                        {
                            ' Please Login or Create an account in order to subscribe'
                        }
                        <SignInScreen />
                    </div>
                )}

                {
                    //todo: if currently subscribed, show to which
                }

                {this.state.currentUser != null && (
                    <div>
                        <SubscriptionOptions
                            user={this.state.currentUser}
                            onClose={this.props.onClose}
                            subscriptionChanged={this.props.onClose}
                        />
                    </div>
                )}
            </div>
        )
    }
}

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
    },
}
