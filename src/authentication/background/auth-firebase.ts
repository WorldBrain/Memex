import {
    AuthenticatedUser,
    AuthenticatedUserWithClaims,
    AuthEvents,
    AuthInterface,
    Claims,
} from 'src/authentication/background/types'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import 'firebase/auth'
import { FirebaseFunctionsAuth } from 'src/authentication/background/firebase-functions-subscription'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'

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

    registerAuthEmitter(authEmitter) {
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
        return { ...user, claims: await this.getUserClaims() }
    }

    async getUserClaims(): Promise<Claims | null> {
        const currentUser = firebase.auth().currentUser
        if (currentUser == null) {
            return null
        }
        const idTokenResult = await currentUser.getIdTokenResult()
        return idTokenResult.claims as Claims
    }

    async refresh() {
        await this.firebaseAuthFunctions.refreshUserClaims()
        await firebase.auth().currentUser.reload()
    }
}
