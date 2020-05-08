import * as React from 'react'
import { auth, subscription } from 'src/util/remote-functions-background'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    AuthContextInterface,
    MemexUser,
} from 'src/authentication/background/types'
import {
    getAuthorizedFeatures,
    getAuthorizedPlans,
    getSubscriptionStatus,
} from 'src/authentication/background/utils'

export const AuthContext = React.createContext<AuthContextInterface>({
    currentUser: null as MemexUser,
})

export class AuthContextProvider extends React.Component<
    {},
    { currentUser: any }
> {
    unsubscribe: () => void

    constructor(props) {
        super(props)
        this.state = { currentUser: null }
    }

    updateUserState = (user) => {
        this.setState({
            currentUser: user,
        })

        if (user !== null && user.claims !== null) {
            this.setState({
                currentUser: {
                    ...user,
                    authorizedFeatures: getAuthorizedFeatures(user.claims),
                    authorizedPlans: getAuthorizedPlans(user.claims),
                    subscriptionStatus: getSubscriptionStatus(user.claims),
                    subscriptionExpiry: user.claims.subscriptionExpiry,
                },
            })
        }
    }

    componentDidMount = async () => {
        const user = await auth.getCurrentUser()
        this.updateUserState(
            user === null
                ? user
                : {
                      ...user,
                      claims: await subscription.getCurrentUserClaims(),
                  },
        )

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
        this.updateUserState(user)
    }

    componentWillUnmount = () => {
        if (this.unsubscribe != null) {
            this.unsubscribe()
        }
    }

    render() {
        return (
            <AuthContext.Provider
                value={{ currentUser: this.state.currentUser }}
            >
                {this.props.children}
            </AuthContext.Provider>
        )
    }
}
