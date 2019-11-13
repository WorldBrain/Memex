import * as React from 'react'
import { AuthenticatedUserWithClaims } from 'src/authentication/background/types'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { SubscriptionOptions } from 'src/authentication/components/Subscription/SubscriptionOptions'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'

type Props = {
    onClose: () => void
} & UserProps

export class Subscribe extends React.PureComponent<Props> {
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
                            onClose={this.props.onClose}
                            subscriptionChanged={this.props.onClose}
                        />
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(Subscribe)

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
    },
}
