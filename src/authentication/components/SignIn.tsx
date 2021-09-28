import * as React from 'react'
import type Firebase from 'firebase/app'
import { getFirebase } from 'src/util/firebase-app-initialized'
import { FirebaseAuth } from 'react-firebaseui'
import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'
import { fontSizeBigger } from 'src/common-ui/components/design-library/typography'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from '../background/types'
import { executeReactStateUITask } from 'src/util/ui-logic'
import { LoadingIndicator } from 'src/common-ui/components'
import { auth } from 'src/util/remote-functions-background'

const styles = require('src/authentication/components/styles.css')

export interface Props {
    authBG: AuthRemoteFunctionsInterface
    redirectTo?: string
    onSuccess?(): void | Promise<void>
    onFail?(): void | Promise<void>
}

interface State {
    postSignInState: UITaskState
}

export class SignInScreen extends React.Component<Props, State> {
    static defaultProps: Pick<Props, 'authBG'> = { authBG: auth }

    state: State = { postSignInState: 'pristine' }
    private firebase: typeof Firebase

    constructor(props: Props) {
        super(props)
        this.firebase = getFirebase()
    }

    private async handlePostSignInLogic() {
        const { authBG, onSuccess, redirectTo } = this.props
        await executeReactStateUITask(this, 'postSignInState', async () => {
            await authBG.runPostLoginLogic()

            // Avoid redirects after sign-in.
            if (redirectTo) {
                window.location.href = redirectTo
            }

            await onSuccess?.()
        })
    }

    render() {
        return (
            <Container>
                {this.state.postSignInState !== 'pristine' ? (
                    <LoadingIndicator />
                ) : (
                    <StyledFirebaseAuth
                        className={styles.firebaseAuth}
                        firebaseAuth={this.firebase.auth()}
                        uiConfig={{
                            signInFlow: 'popup',
                            signInOptions: [
                                {
                                    provider: this.firebase.auth
                                        .EmailAuthProvider.PROVIDER_ID,
                                    requireDisplayName: false,
                                },
                            ],
                            callbacks: {
                                signInSuccessWithAuthResult: async () => {
                                    await this.handlePostSignInLogic()
                                    return false
                                },
                                signInFailure: async () => {
                                    await this.props.onFail?.()
                                },
                            },
                        }}
                    />
                )}
            </Container>
        )
    }
}

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 450px;
`

const StyledFirebaseAuth = styled(FirebaseAuth)`
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
        font-size: 14px;
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

    .mdl-card {
        min-height: unset;
    }

    input.firebaseui-input,
    input.firebaseui-input-invalid {
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
        background: none;
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
        top: 0px;
    }

    .firebaseui-card-actions {
        flex-direction: column-reverse;
        justify-content: center;
        align-items: center;
        display: flex;
        padding-bottom: 0px;
    }

    .firebaseui-form-actions {
        display: flex;
        text-align: unset;
        width: unset;
        justify-content: center;
        margin-bottom: 10px;
    }

    .firebaseui-form-links {
        display: flex;
        width: unset;
        vertical-align: unset;
        justify-content: center;
        margin-bottom: 20px;
    }

    .firebaseui-button {
        margin-left: unset;
    }

    .mdl-textfield {
        margin-top: -20px;
    }
`
