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
    }

    showSubscriptionModal = () => this.setState({ showSubscriptionModal: true })

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
                <TypographyHeadingPage>My Account Data</TypographyHeadingPage>
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
                            value={user.email}
                            readonly
                        />
                        <TypographyInputTitle>
                            {' '}
                            Display Name{' '}
                        </TypographyInputTitle>
                        <InputTextField
                            type={'text'}
                            value={user.displayName}
                            readonly
                        />
                        <input
                            type={'hidden'}
                            name={'Email Verified'}
                            value={JSON.stringify(user.emailVerified)}
                        />
                        <input
                            type={'hidden'}
                            name={'User ID'}
                            value={user.id}
                        />
                        <input
                            type={'hidden'}
                            name={'Features'}
                            value={JSON.stringify(features)}
                        />
                        <input
                            type={'hidden'}
                            name={'Plans'}
                            value={JSON.stringify(this.props.authorizedPlans)}
                        />
                    </div>
                )}
            </FullPage>
        )
    }
}

export default withCurrentUser(AccountInfo)
