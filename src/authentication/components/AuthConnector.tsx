import * as React from 'react'
import { auth } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { Optionalize } from 'src/util/types'

export interface UserProps {
    currentUser: AuthenticatedUser | null
    authorizedFeatures: UserFeature[]
}

export function withCurrentUser<P extends UserProps = UserProps>(
    // tslint:disable-next-line:variable-name
    WrappedComponent: React.ComponentType<P>,
) {
    return class extends React.Component<Optionalize<P, UserProps>, UserProps> {
        unsubscribe: () => void
        constructor(props) {
            super(props)
            this.state = { currentUser: null, authorizedFeatures: [] }
        }

        componentDidMount = async () => {
            this.setState({
                currentUser: await auth.getCurrentUser(),
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
                    {...(this.props as P)}
                />
            )
        }
    }
}
