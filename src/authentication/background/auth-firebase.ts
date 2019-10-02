import { AuthInterface, Claims } from 'src/authentication/background/types'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import 'firebase/auth'
import { FirebaseFunctionsAuth } from 'src/authentication/background/firebase-functions-subscription'

export class AuthFirebase implements AuthInterface {
    private authObserver: firebase.Unsubscribe
    private user
    private authEmitter: {
        emit: (eventName: string, data: any) => Promise<any>
    }
    private firebaseAuthFunctions = new FirebaseFunctionsAuth()

    constructor() {
        // this.userEventHandler = new EventEmitter() as TypedEventEmitter<any>

        this.authEmitter = remoteEventEmitter('auth')
        this.authObserver = firebase.auth().onAuthStateChanged(user => {
            console.log('Auth State Changed (bg script):', user)
            this.user = user
            // this.setState({isSignedIn: !!user});
            this.authEmitter.emit('onAuthStateChanged', user)
        })
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
        console.log('idTokenResult', idTokenResult)
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
