import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import AccountInfo from 'src/authentication/components/AccountInfo'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
const styles = require('./styles.css')
interface Props {
    initiallyShowSubscriptionModal?: boolean
}

class UserScreen extends React.PureComponent<Props & UserProps> {
    render() {
        return (
            <div className={styles.authContainer}>
                {this.props.currentUser == null && <SignInScreen />}
                {this.props.currentUser != null && (
                    <AccountInfo
                        initiallyShowSubscriptionModal={
                            this.props.initiallyShowSubscriptionModal
                        }
                    />
                )}
            </div>
        )
    }
}
export default withCurrentUser(UserScreen)
