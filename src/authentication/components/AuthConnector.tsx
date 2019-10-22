import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'

// tslint:disable-next-line:variable-name
export function withCurrentUser(WrappedComponent) {
    return class extends React.Component<
        any,
        { currentUser: AuthenticatedUserWithClaims | null }
    > {
        unsubscribe: () => void
        constructor(props) {
            super(props)
            this.state = { currentUser: null }
        }

        componentDidMount = async () => {
            this.setState({ currentUser: await auth.getUser() })
            const authEvents = getRemoteEventEmitter('auth')
            authEvents.addListener(
                'onAuthStateChanged',
                this.listenOnAuthStateChanged,
            )
            this.unsubscribe = () =>
                authEvents.removeListener(
                    'onAuthStateChanged',
                    this.listenOnAuthStateChanged,
                )
        }

        listenOnAuthStateChanged = async user => {
            this.setState({ currentUser: user })
        }

        componentWillUnmount = () => {
            this.unsubscribe()
        }

        render() {
            return (
                <WrappedComponent
                    currentUser={this.state.currentUser}
                    {...this.props}
                />
            )
        }
    }
}
