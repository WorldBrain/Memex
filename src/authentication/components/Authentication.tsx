import * as React from 'react'

import 'firebase/auth'
import { getRemoteEventEmitter } from 'src/util/webextensionRPC'
import { auth } from 'src/util/remote-functions-background'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { UserInfo } from 'src/authentication/components/UserInfo'
const styles = require('./styles.css')
interface Props {
    currentUser: any
    setUser: any
}

interface State {
    currentUser: any
}

class Authentication extends React.PureComponent<Props, State> {
    state = { currentUser: null }

    componentDidMount = async () => {
        this.setState({ currentUser: await auth.getUser() })

        const authEvents = getRemoteEventEmitter('auth')

        authEvents.addListener('onAuthStateChanged', _user => {
            this.setState({ currentUser: _user })
        })
    }

    render() {
        return (
            <div className={styles.authContainer}>
                {this.state.currentUser == null && <SignInScreen />}
                {this.state.currentUser != null && <UserInfo />}
            </div>
        )
    }
}
export default Authentication
