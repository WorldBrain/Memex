import * as React from 'react'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import {
    TypographyHeadingPage,
    TypographyInputTitle,
} from 'src/common-ui/components/design-library/typography'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import Link from 'src/common-ui/components/link'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'

interface Props {
    initiallyShowSubscriptionModal?: boolean
    showSubscriptionModal: () => void
}

export class AccountInfo extends React.PureComponent<Props & UserProps> {
    componentDidMount(): void {
        if (this.props.initiallyShowSubscriptionModal) {
            this.props.showSubscriptionModal()
        }
    }

    render() {
        const user = this.props.currentUser
        const features = this.props.authorizedFeatures
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

export default connect(null, dispatch => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountInfo))
