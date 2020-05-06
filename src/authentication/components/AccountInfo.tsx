import * as React from 'react'
import {
    TypographyHeadingPage,
    TypographyInputTitle,
} from 'src/common-ui/components/design-library/typography'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'
import { AuthContextInterface } from 'src/authentication/background/types'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'

const hiddenInProduction =
    process.env.NODE_ENV === 'production' ? 'hidden' : 'text'
const dev = process.env.NODE_ENV !== 'production'

interface Props {
    initiallyShowSubscriptionModal?: boolean
    showSubscriptionModal: () => void
}

export class AccountInfo extends React.PureComponent<
    Props & AuthContextInterface
> {
    componentDidMount(): void {
        if (this.props.initiallyShowSubscriptionModal) {
            this.props.showSubscriptionModal()
        }
    }

    render() {
        const user = this.props.currentUser
        const features = user?.authorizedFeatures
        const plans = user?.authorizedPlans
        return (
            <FullPage>
                <TypographyHeadingPage>My Account</TypographyHeadingPage>
                <br />
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
                            disabled
                        />

                        <PrimaryButton
                            onClick={this.props.showSubscriptionModal}
                        >
                            {'Manage Subscriptions'}
                        </PrimaryButton>

                        <InputTextField
                            type={hiddenInProduction}
                            name={'User ID'}
                            defaultValue={user.id}
                            readOnly
                        />
                        <InputTextField
                            type={hiddenInProduction}
                            name={'Email Verified'}
                            defaultValue={`EmailVerified: ${JSON.stringify(
                                user.emailVerified,
                            )}`}
                            readOnly
                        />
                        <InputTextField
                            type={hiddenInProduction}
                            name={'Features'}
                            defaultValue={features}
                            readOnly
                        />
                        <InputTextField
                            type={hiddenInProduction}
                            name={'Plans'}
                            defaultValue={plans}
                            readOnly
                        />
                        <InputTextField
                            type={hiddenInProduction}
                            name={'subscriptionStatus'}
                            defaultValue={user.subscriptionStatus}
                            readOnly
                        />
                        <InputTextField
                            type={hiddenInProduction}
                            name={'subscriptionExpiry'}
                            defaultValue={
                                user.subscriptionExpiry &&
                                new Date(
                                    user.subscriptionExpiry * 1000,
                                ).toLocaleString()
                            }
                            readOnly
                        />
                    </div>
                )}
            </FullPage>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountInfo))
