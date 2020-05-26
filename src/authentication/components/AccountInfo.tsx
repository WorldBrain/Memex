import * as React from 'react'
import { TypographyInputTitle } from 'src/common-ui/components/design-library/typography'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'
import { AuthContextInterface } from 'src/authentication/background/types'
import { auth, subscription } from 'src/util/remote-functions-background'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

const styles = require('./styles.css')

const hiddenInProduction =
    process.env.NODE_ENV === 'production' ? 'hidden' : 'text'
const dev = process.env.NODE_ENV !== 'production'

interface Props {
    showSubscriptionModal: () => void
    refreshUser?: boolean
}

export class AccountInfo extends React.Component<Props & AuthContextInterface> {
    state = {
        loadingChargebee: false,
    }

    openPortal = async () => {
        this.setState({
            loadingChargebee: true,
        })
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
        this.setState({
            loadingChargebee: false,
        })
    }

    componentDidMount() {
        if (this.props.refreshUser) {
            this.handleRefresh()
        }
    }

    handleRefresh = async () => {
        await auth.refreshUserInfo()
    }

    render() {
        const user = this.props.currentUser
        const features = user?.authorizedFeatures
        const plans = user?.authorizedPlans
        return (
            <FullPage>
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
                        {!user.subscriptionStatus && (
                            <InputTextField
                                name={'Plans'}
                                defaultValue={'No subscriptions yet'}
                                readOnly
                            />
                        )}
                        {user.subscriptionStatus && (
                            <div>
                                <TypographyInputTitle>
                                    {' '}
                                    Subscription Status{' '}
                                </TypographyInputTitle>
                                <InputTextField
                                    name={'subscriptionStatus'}
                                    defaultValue={user.subscriptionStatus}
                                    readOnly
                                />
                            </div>
                        )}

                        {user.subscriptionExpiry && (
                            <div>
                                {user.subscriptionStatus === 'non_renewing' ? (
                                    <div>
                                        <TypographyInputTitle>
                                            {' '}
                                            Expiration Date{' '}
                                        </TypographyInputTitle>
                                        <InputTextField
                                            name={'subscriptionExpiry'}
                                            defaultValue={
                                                user.subscriptionExpiry &&
                                                new Date(
                                                    user.subscriptionExpiry *
                                                        1000,
                                                ).toLocaleString()
                                            }
                                            readOnly
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <TypographyInputTitle>
                                            {' '}
                                            Renewal Date{' '}
                                        </TypographyInputTitle>
                                        <InputTextField
                                            name={'subscriptionExpiry'}
                                            defaultValue={
                                                user.subscriptionExpiry &&
                                                new Date(
                                                    user.subscriptionExpiry *
                                                        1000,
                                                ).toLocaleString()
                                            }
                                            readOnly
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={styles.buttonBox}>
                            {!user.subscriptionStatus ? (
                                <div className={styles.button}>
                                    <PrimaryButton
                                        onClick={
                                            this.props.showSubscriptionModal
                                        }
                                    >
                                        {'Upgrade Subscription'}
                                    </PrimaryButton>
                                </div>
                            ) : (
                                <div>
                                    {this.state.loadingChargebee ||
                                    this.props.loadingUser ? (
                                        <div className={styles.button}>
                                            <PrimaryButton onClick={() => null}>
                                                <LoadingIndicator />
                                            </PrimaryButton>
                                        </div>
                                    ) : (
                                        <div className={styles.button}>
                                            <PrimaryButton
                                                onClick={this.openPortal}
                                            >
                                                {'Edit Subscriptions'}
                                            </PrimaryButton>
                                        </div>
                                    )}
                                </div>
                            )}
                            <span className={styles.horizontalSpace} />
                            {this.state.loadingChargebee ||
                            this.props.loadingUser ? (
                                <PrimaryButton onClick={() => null}>
                                    <LoadingIndicator />
                                </PrimaryButton>
                            ) : (
                                <PrimaryButton onClick={this.handleRefresh}>
                                    Refresh Subscription Status
                                </PrimaryButton>
                            )}
                        </div>
                        {dev === true && (
                            <div>
                                <TypographyInputTitle>
                                    {' '}
                                    User-ID{' '}
                                </TypographyInputTitle>
                                <InputTextField
                                    type={hiddenInProduction}
                                    name={'User ID'}
                                    defaultValue={user.id}
                                    readOnly
                                />
                                <TypographyInputTitle>
                                    {' '}
                                    Enabled Features{' '}
                                </TypographyInputTitle>
                                <InputTextField
                                    type={hiddenInProduction}
                                    name={'Features'}
                                    defaultValue={features}
                                    readOnly
                                />
                                <TypographyInputTitle>
                                    {' '}
                                    Email Address Verified?{' '}
                                </TypographyInputTitle>

                                <InputTextField
                                    type={hiddenInProduction}
                                    name={'Email Verified'}
                                    defaultValue={`EmailVerified: ${JSON.stringify(
                                        user.emailVerified,
                                    )}`}
                                    readOnly
                                />
                            </div>
                        )}
                    </div>
                )}
            </FullPage>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountInfo))
