import * as React from 'react'
import { getFirebase } from 'src/util/firebase-app-initialized'
import { FirebaseAuth } from 'react-firebaseui'
import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'
import { fontSizeBigger } from 'src/common-ui/components/design-library/typography'
import { auth } from 'src/util/remote-functions-background'

const styles = require('src/authentication/components/styles.css')

interface Props {
    onSuccess?(): void
    onFail?(): void
    redirectTo?: string
}

export class SignInScreen extends React.Component<Props> {
    render = () => {
        return (
            <StyledFirebaseAuth
                className={styles.firebaseAuth}
                uiConfig={{
                    signInFlow: 'popup',
                    signInOptions: [{
                        provider: getFirebase().auth.EmailAuthProvider.PROVIDER_ID,
                        requireDisplayName: false,
                    },    
                    ],
                    callbacks: {
                        signInSuccessWithAuthResult: () => {
                            auth.refreshUserInfo()
                            // Avoid redirects after sign-in.
                            if (this.props.redirectTo) {
                                window.location.href = this.props.redirectTo
                            }
                            this.props.onSuccess?.()
                            return false
                        },
                        signInFailure: () => {
                            this.props.onFail?.()
                        },
                    },
                }}
                firebaseAuth={getFirebase().auth()}
            />
        )
    }
}

const StyledFirebaseAuth = styled(FirebaseAuth)`
    width: 450px;

    .firebaseui-id-submit {
        background-color: ${colorPrimary};
        border-radius: 3px;
        box-shadow: none;
    }

    .mdl-button--raised.mdl-button--colored {
        background-color: ${colorPrimary};
    }

    .firebaseui-id-submit :hover {
        background-color: ${colorPrimary};
    }

    .firebaseui-input {
        border-radius: 3px;
        background-color: #f0f0f0;
        height: 34px;
        padding: 0 15px;
    }

    .mdl-textfield.is-invalid .mdl-textfield__input {
        border-radius: 3px;
        background-color: #f0f0f0;
        height: 34px;
        padding: 0 15px;
    }

    .mdl-textfield--floating-label .mdl-textfield__label {
            padding: 0 15px;
    }

    .firebaseui-textfield.mdl-textfield .firebaseui-label::after {
        background: none;
    }

    .firebaseui-error-wrapper {
        min-height: unset;
    }

    .mdl-textfield__label:after {
        background: none;
    }

    input.firebaseui-input, input.firebaseui-input-invalid {
        border-radius: 3px;
        background-color: #f0f0f0;
        height: 34px;
        padding: 0 15px;
    }

    .mdl-textfield__input {
        border: none;
        border-bottom: none;
        box-shadow: none;
    }

    .firebaseui-container {
        margin: 0 auto;
        max-width: none;
        box-shadow: none;
    }

    .firebaseui-card-header {
        font-size: ${fontSizeBigger}px;
        font-weight: 600;
        color: #000000;
        margin-bottom: 0.5em;
        display: none;
    }

    .firebaseui-link {
        color: rgba(0, 0, 0, 0.18);
    }

    .firebaseui-id-secondary-link {
        color: ${colorPrimary};
    }

    .firebaseui-input-floating-button {
        height: 34px;
        width: 44px;
    }

`
