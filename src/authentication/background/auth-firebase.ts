import {
    AuthenticatedUserWithClaims,
    AuthInterface,
    Claims,
} from 'src/authentication/background/types'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import 'firebase/auth'
import { FirebaseFunctionsAuth } from 'src/authentication/background/firebase-functions-subscription'

export class AuthFirebase implements AuthInterface {
    private firebaseAuthObserver: firebase.Unsubscribe

    private firebaseAuthFunctions = new FirebaseFunctionsAuth()

    async getCurrentUser(): Promise<firebase.User | null> {
        return firebase.auth().currentUser
    }

    registerAuthEmitter(authEmitter) {
        this.firebaseAuthObserver = firebase
            .auth()
            .onAuthStateChanged(async user => {
                if (user != null) {
                    ;(user as AuthenticatedUserWithClaims).claims = await this.getUserClaims()
                }
                return authEmitter.emit('onAuthStateChanged', user)
            })
    }

    async getUserClaims(): Promise<Claims> {
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
