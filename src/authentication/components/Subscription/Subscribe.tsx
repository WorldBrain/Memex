import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'
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
                        {
                            ' Please Login or Create an account in order to subscribe'
                        }
                        <SignInScreen />
                    </div>
                )}

                {
                    // todo: if currently subscribed, show to which
                }

                {this.props.currentUser != null && (
                    <div>
                        <SubscriptionOptions
                            user={this.props.currentUser}
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
