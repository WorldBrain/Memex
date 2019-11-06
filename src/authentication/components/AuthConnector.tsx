import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    AuthenticatedUser,
    AuthenticatedUserWithClaims,
    UserFeatures,
} from 'src/authentication/background/types'

interface State {
    currentUser: AuthenticatedUserWithClaims | AuthenticatedUser | null
    authorizedFeatures: UserFeatures[]
}

// tslint:disable-next-line:variable-name
export function withCurrentUser(WrappedComponent) {
    return class extends React.Component<any, State> {
        unsubscribe: () => void
        constructor(props) {
            super(props)
            this.state = { currentUser: null, authorizedFeatures: [] }
        }

        componentDidMount = async () => {
            this.setState({
                currentUser: await auth.getUser(),
                authorizedFeatures: await auth.getAuthorizedFeatures(),
            })
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
            if (this.unsubscribe != null) {
                this.unsubscribe()
            }
        }

        render() {
            return (
                <WrappedComponent
                    currentUser={this.state.currentUser}
                    authorizedFeatures={this.state.authorizedFeatures}
                    {...this.props}
                />
            )
        }
    }
}
