import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { SubscriptionOptionsChargebee } from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { auth } from 'src/util/remote-functions-background'

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
            <div className={''}>
                {this.props.currentUser == null && (
                    <div>
                        <span>
                            {
                                ' Please Login or Create an account in order to subscribe'
                            }
                        </span>
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
