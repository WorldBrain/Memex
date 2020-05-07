import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import AccountInfo from 'src/authentication/components/AccountInfo'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { AuthContextInterface } from 'src/authentication/background/types'
import { auth } from 'src/util/remote-functions-background'
const styles = require('./styles.css')

interface Props {
    initiallyShowSubscriptionModal?: boolean
    refreshUser?: boolean
    refreshing: boolean
}

class UserScreen extends React.PureComponent<Props & AuthContextInterface> {
    componentDidMount() {
        if (this.props.refreshUser) {
            auth.refreshUserInfo()
        }
    }

    render() {
        return (
            <div className={styles.section}>
                {this.props.currentUser === null ? (
                    <div>
                        <p className={styles.instructionsTitle}>
                            {' Login or Create an Account'}
                        </p>
                        <p className={styles.instructions}>
                            {
                                ' To create an account just type in a new email address'
                            }
                        </p>
                        <SignInScreen redirectTo={LOGIN_URL} />
                    </div>
                ) : (
                    <AccountInfo
                        refreshing={false}
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
