import * as React from 'react'
import { auth, subscription } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    SubscriptionStatus,
    UserFeature,
    UserPlan,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { Optionalize } from 'src/util/types'

export interface UserProps {
    currentUser: AuthenticatedUser | null
    authorizedFeatures: UserFeature[]
    authorizedPlans: UserPlan[]
    subscriptionStatus: SubscriptionStatus
}

export function withCurrentUser<P extends UserProps = UserProps>(
    // tslint:disable-next-line:variable-name
    WrappedComponent: React.ComponentType<P>,
) {
    return class extends React.Component<Optionalize<P, UserProps>, UserProps> {
        unsubscribe: () => void
        constructor(props) {
            super(props)
            this.state = {
                currentUser: null,
                subscriptionStatus: null as SubscriptionStatus,
                authorizedFeatures: [] as UserFeature[],
                authorizedPlans: [] as UserPlan[],
            }
        }

        updateUserState = async (user) => {
            this.setState({
                currentUser: user,
                authorizedFeatures: await auth.getAuthorizedFeatures(),
                authorizedPlans: await auth.getAuthorizedPlans(),
                subscriptionStatus: await auth.getSubscriptionStatus(),
            })
        }

        componentDidMount = async () => {
            await this.updateUserState(await auth.getCurrentUser())

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

        listenOnAuthStateChanged = async (user) => {
            await this.updateUserState(user)
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
                    authorizedPlans={this.state.authorizedPlans}
                    subscriptionStatus={this.state.subscriptionStatus}
                    {...(this.props as P)}
                />
            )
        }
    }
}
