import {
    AuthEvents,
    AuthInterface,
    Claims,
} from 'src/authentication/background/types'
import {
    RemoteEventEmitter,
    remoteEventEmitter,
} from 'src/util/webextensionRPC'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import 'firebase/auth'
import { FirebaseFunctionsAuth } from 'src/authentication/background/firebase-functions-subscription'

export class AuthFirebase implements AuthInterface {
    private firebaseAuthObserver: firebase.Unsubscribe
    private authEmitter: RemoteEventEmitter<AuthEvents>

    private firebaseAuthFunctions = new FirebaseFunctionsAuth()

    constructor() {
        this.registerAuthEmitter()
    }

    registerAuthEmitter() {
        this.authEmitter = remoteEventEmitter('auth')
        this.firebaseAuthObserver = firebase
            .auth()
            .onAuthStateChanged(user =>
                this.authEmitter.emit('onAuthStateChanged', user),
            )
    }

    async getCurrentUser(): Promise<firebase.User | null> {
        return firebase.auth().currentUser
    }

    async getUserClaims(): Promise<Claims> {
        const currentUser = firebase.auth().currentUser
        if (currentUser == null) {
            return null
        }

        const idTokenResult = await currentUser.getIdTokenResult()
        return idTokenResult.claims as Claims
    }

    // todo(ch): Also provide mechanism for 'hasBackupEnabled' which looks at feature claims, not just subscription claims, incase features change.
    async refresh() {
        // call firebase function,
        // then reauthenticate
        await this.firebaseAuthFunctions.refreshUserClaims()
        await firebase.auth().currentUser.reload() // todo (ch): I think this is the right method

        return null
    }
}
