import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import UserInfo from 'src/authentication/components/UserInfo'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
const styles = require('./styles.css')

class UserScreen extends React.PureComponent<UserProps> {
    render() {
        return (
            <div className={styles.authContainer}>
                {this.props.currentUser == null && <SignInScreen />}
                {this.props.currentUser != null && <UserInfo />}
            </div>
        )
    }
}
export default withCurrentUser(UserScreen)
