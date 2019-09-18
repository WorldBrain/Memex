import * as firebase from 'firebase/app'
import 'firebase/auth'

import { AuthInterface, Claims } from 'src/authentication/background/types'

export class AuthFirebase implements AuthInterface {
    async getCurrentUser(): Promise<any> {
        const id = firebase.auth().currentUser
        return { id }
    }

    async getUserClaims(): Promise<Claims> {
        const idTokenResult = await firebase
            .auth()
            .currentUser.getIdTokenResult()
        return idTokenResult.claims as Claims
    }

    async refresh() {
        // Call Firebase function to read the user's subscription status out of the database/Shop provider
        // which resets the claims.
        // Then refresh the client token
        return null
    }
}
