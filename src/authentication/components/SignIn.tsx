import * as React from 'react'
import { firebase } from 'src/util/firebase-app-initialized'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
export class SignInScreen extends React.Component {
    render = () => {
        return (
            <StyledFirebaseAuth
                uiConfig={{
                    signInFlow: 'popup',
                    signInOptions: [
                        firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    ],
                    callbacks: {
                        // Avoid redirects after sign-in.
                        signInSuccessWithAuthResult: () => false,
                    },
                }}
                firebaseAuth={firebase.auth()}
            />
        )
    }
}
