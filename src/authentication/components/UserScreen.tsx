import * as React from 'react'
import 'firebase/auth'
import { SignInScreen } from 'src/authentication/components/SignIn'
import AccountInfo from 'src/authentication/components/AccountInfo'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { AuthContextInterface } from 'src/authentication/background/types'
import { auth } from 'src/util/remote-functions-background'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
const styles = require('./styles.css')

interface Props {
    initiallyShowSubscriptionModal?: boolean
    refreshUser?: boolean
    showSubscriptionModal: () => void
}

class UserScreen extends React.Component<Props & AuthContextInterface> {
    async componentDidMount() {
        // N.B. when trying to move the `refreshUser` logic here from `AccountInfo` there are
        // inconsistent invocations when running on a new tab load vs navigation from existing page,
        // the RPC function does not seem to be registered in time for new loads

        if (this.props.initiallyShowSubscriptionModal) {
            this.props.showSubscriptionModal()
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
                    <AccountInfo refreshUser={this.props.refreshUser} />
                )}
            </div>
        )
    }
}
export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(UserScreen))
