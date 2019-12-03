import * as React from 'react'
import { getFirebase } from 'src/util/firebase-app-initialized'
import { FirebaseAuth } from 'react-firebaseui'
const styles = require('src/authentication/components/styles.css')

export class SignInScreen extends React.Component {
    render = () => {
        return (
            <FirebaseAuth
                className={styles.firebaseAuth}
                uiConfig={{
                    signInFlow: 'popup',
                    signInOptions: [
                        getFirebase().auth.EmailAuthProvider.PROVIDER_ID,
                    ],
                    callbacks: {
                        // Avoid redirects after sign-in.
                        signInSuccessWithAuthResult: () => false,
                    },
                }}
                firebaseAuth={getFirebase().auth()}
            />
        )
    }
}
