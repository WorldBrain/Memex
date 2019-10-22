import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import UserInfo from 'src/authentication/components/UserInfo'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
const styles = require('./styles.css')
interface Props {
    currentUser: any
    setUser: any
}

interface State {
    currentUser: any
}
class Authentication extends React.PureComponent<Props, State> {
    render() {
        return (
            <div className={styles.authContainer}>
                {this.props.currentUser == null && <SignInScreen />}
                {this.props.currentUser != null && <UserInfo />}
            </div>
        )
    }
}
export default withCurrentUser(Authentication)
