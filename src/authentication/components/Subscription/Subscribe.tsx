import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { SubscriptionOptionsChargebee } from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { auth } from 'src/util/remote-functions-background'
const styles = require('../styles.css')

type Props = {
    onClose: () => void
} & UserProps

export class Subscribe extends React.PureComponent<Props> {
    handleSubscriptionChanged = () => {
        this.handleRefresh()
    }

    handleClose = () => {
        this.props.onClose()
    }

    handleRefresh = async () => {
        await auth.refreshUserInfo()
    }

    render() {
        return (
            <div>
                {this.props.currentUser == null && (
                    <div className={styles.section}>
                        <p className={styles.instructionsTitle}>
                            {' Login or Create an account to subscribe'}
                        </p>
                        <p className={styles.instructions}>
                            {
                                ' To create an account just type in a new email address'
                            }
                        </p>
                        <SignInScreen />
                    </div>
                )}

                {this.props.currentUser != null && (
                    <div>
                        <SubscriptionOptionsChargebee
                            user={this.props.currentUser}
                            plans={this.props.authorizedPlans}
                            onClose={this.handleClose}
                            subscriptionChanged={this.handleSubscriptionChanged}
                        />
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(Subscribe)
