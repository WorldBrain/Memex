import * as React from 'react'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { SubscribeModal } from 'src/authentication/components/Subscription/SubscribeModal'
import {
    TypographyHeadingPage,
    TypographyInputTitle,
} from 'src/common-ui/components/design-library/typography'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { PrimaryButton } from 'src/common-ui/components/primary-button'

interface Props {
    initiallyShowSubscriptionModal?: boolean
}

interface State {
    showSubscriptionModal: boolean
}

export class AccountInfo extends React.Component<Props & UserProps, State> {
    state = { showSubscriptionModal: false }

    hideSubscriptionModal = () => {
        this.setState({ showSubscriptionModal: false })
        // If the url has subscription, remove it
    }

    showSubscriptionModal = () => this.setState({ showSubscriptionModal: true })
    // if the url does not have subscription, add it

    componentDidMount(): void {
        if (this.props.initiallyShowSubscriptionModal) {
            this.setState({ showSubscriptionModal: true })
        }
    }

    render() {
        const user = this.props.currentUser
        const features = this.props.authorizedFeatures
        return (
            <FullPage>
                <TypographyHeadingPage>My Account</TypographyHeadingPage>
                {this.state.showSubscriptionModal === true && (
                    <SubscribeModal onClose={this.hideSubscriptionModal} />
                )}
                {user != null && (
                    <div>
                        <TypographyInputTitle>
                            {' '}
                            Email Address{' '}
                        </TypographyInputTitle>
                        <InputTextField
                            type={'text'}
                            defaultValue={user.email}
                            readonly
                        />

                        <PrimaryButton onClick={this.showSubscriptionModal}>
                            Manage Subscriptions
                        </PrimaryButton>

                        <input
                            type={'hidden'}
                            name={'Email Verified'}
                            defaultValue={JSON.stringify(user.emailVerified)}
                            readOnly
                        />
                        <input
                            type={'hidden'}
                            name={'User ID'}
                            defaultValue={user.id}
                            readOnly
                        />
                        <input
                            type={'hidden'}
                            name={'Features'}
                            defaultValue={JSON.stringify(features)}
                            readOnly
                        />
                        <input
                            type={'hidden'}
                            name={'Plans'}
                            defaultValue={JSON.stringify(
                                this.props.authorizedPlans,
                            )}
                            readOnly
                        />
                    </div>
                )}
            </FullPage>
        )
    }
}

export default withCurrentUser(AccountInfo)
