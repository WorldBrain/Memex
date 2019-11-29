import * as React from 'react'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import { getFirebase } from 'src/util/firebase-app-initialized'
const styles = require('src/authentication/components/styles.css')

export class SignInScreen extends React.Component {
    render = () => {
        return (
            <StyledFirebaseAuth
                className={styles.flex}
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
