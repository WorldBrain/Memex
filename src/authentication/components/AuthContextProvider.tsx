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
    loadingUser: false,
})

export class AuthContextProvider extends React.Component<
    {},
    { currentUser: any; loadingUser: boolean }
> {
    unsubscribe: () => void

    constructor(props) {
        super(props)
        this.state = { currentUser: null, loadingUser: false }
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
        this.setState({
            loadingUser: false,
        })
    }

    componentDidMount = async () => {
        this.setState({
            loadingUser: true,
        })

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
        authEvents.addListener('onLoadingUser', this.listenOnLoadingUser)
        this.unsubscribe = () => {
            authEvents.removeListener(
                'onAuthStateChanged',
                this.listenOnAuthStateChanged,
            )
            authEvents.removeListener('onLoadingUser', this.listenOnLoadingUser)
        }
    }

    listenOnAuthStateChanged = async (user) => {
        this.updateUserState(user)
    }

    listenOnLoadingUser = async (loadingUser) => {
        this.setState({ loadingUser })
    }

    componentWillUnmount = () => {
        if (this.unsubscribe != null) {
            this.unsubscribe()
        }
    }

    render() {
        return (
            <AuthContext.Provider
                value={{
                    currentUser: this.state.currentUser,
                    loadingUser: this.state.loadingUser,
                }}
            >
                {this.props.children}
            </AuthContext.Provider>
        )
    }
}
