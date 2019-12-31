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
            <div className={styles.section}>
                {this.props.currentUser == null ? (
                    <p>
                        <p className={styles.instructionsTitle}>
                            {' Login or Create an Account'}
                        </p>
                        <p className={styles.instructions}>
                            {
                                ' To create an account just type in a new email address'
                            }
                        </p>
                        <SignInScreen />
                    </p>
                ) : (
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
