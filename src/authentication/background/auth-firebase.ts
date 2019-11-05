import {
    AuthenticatedUser,
    AuthenticatedUserWithClaims,
    AuthEvents,
    AuthInterface,
} from 'src/authentication/background/types'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import 'firebase/auth'
import { FirebaseFunctionsAuth } from 'src/authentication/background/firebase-functions-subscription'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    Claims,
    SubscriptionMap,
    FeaturesMap,
} from 'firebase-backend/firebase/functions/src/types'
import { UserSubscription } from 'src/authentication/components/user-subscription'

export class AuthFirebase implements AuthInterface {
    private firebaseAuthObserver: firebase.Unsubscribe

    private firebaseAuthFunctions = new FirebaseFunctionsAuth()
    private authEmitter: RemoteEventEmitter<AuthEvents>

    private getUserFromFirebaseUser(user): AuthenticatedUser | null {
        if (user == null) {
            return null
        }
        return {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            emailVerified: user.emailVerified,
        }
    }

    async getCurrentUser(): Promise<AuthenticatedUserWithClaims | null> {
        const user = firebase.auth().currentUser
        return this.withClaims(this.getUserFromFirebaseUser(user))
    }

    registerAuthEmitter = authEmitter => {
        this.authEmitter = authEmitter
        this.firebaseAuthObserver = firebase
            .auth()
            .onAuthStateChanged(async user => {
                const emitUser = await this.withClaims(
                    this.getUserFromFirebaseUser(user),
                )
                this.authEmitter.emit('onAuthStateChanged', emitUser)
            })
    }

    private async withClaims(
        user: AuthenticatedUser,
    ): Promise<AuthenticatedUserWithClaims | null> {
        if (user == null) {
            return null
        }
        return { ...user, claims: await this.getUserClaims() }
    }

    async getUserClaims(): Promise<Claims | null> {
        const currentUser = firebase.auth().currentUser
        if (currentUser == null) {
            return null
        }
        const idTokenResult = await currentUser.getIdTokenResult()

        const claims: Claims = idTokenResult.claims as Claims

        // Type juggling from object to Map
        for (const key of Object.keys(claims)) {
            if (key === 'subscriptions') {
                claims[key] = new Map(
                    Object.entries(claims[key]),
                ) as SubscriptionMap
            } else if (key === 'features') {
                claims[key] = new Map(
                    Object.entries(claims[key]),
                ) as FeaturesMap
            }
        }
        return claims
    }

    async refresh() {
        await this.firebaseAuthFunctions.refreshUserClaims()
        await firebase.auth().currentUser.reload()
    }
}
