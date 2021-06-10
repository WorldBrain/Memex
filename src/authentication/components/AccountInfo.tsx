import * as React from 'react'
import styled, { css } from 'styled-components'

import { TypographyInputTitle } from 'src/common-ui/components/design-library/typography'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'
import { AuthContextInterface } from 'src/authentication/background/types'
import { auth, subscription } from 'src/util/remote-functions-background'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { TaskState } from 'ui-logic-core/lib/types'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'
import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'


const styles = require('./styles.css')

const hiddenInProduction =
    process.env.NODE_ENV === 'production' ? 'hidden' : 'text'
const dev = process.env.NODE_ENV !== 'production'

const DisplayNameBox = styled.div`
    & > div {


        & > div {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;

            & > input {
                margin: 0 10px 0 0;
                width: 100%;
                text-align: left;
                padding: 10px 20px;
            }
        }
    }
`

interface Props {
    showSubscriptionModal: () => void
    refreshUser?: boolean
}

interface State {
    isPioneer?: boolean
    loadState: TaskState
    displayName?: string
    newDisplayName?: string
    updateProfileState: TaskState
}

export class AccountInfo extends React.Component<Props & AuthContextInterface> {
    state = {
        loadingChargebee: false,
        plans: [],
        features: [],
        loadState: 'running',
        isPioneer: false,
        updateProfileState: 'pristine',
        newDisplayName: ''
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

    async componentDidMount() {
        this.handleRefresh()
        this.getDisplayName()
    }

    async getDisplayName() {
        this.setState({ loadState: 'running' })
        try {
            const profile = await auth.getUserProfile()
            this.setState({
                loadState: 'success',
                newDisplayName: profile?.displayName ?? undefined,
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }
    }

    updateDisplayName = async () => {
        this.setState({
            updateProfileState: 'running',
        })
        try {
            await auth.updateUserProfile({
                displayName: this.state.newDisplayName,
            })
            this.setState({
                updateProfileState: 'success',
                displayName: this.state.newDisplayName,
                newDisplayName: this.state.newDisplayName,
            })
        } catch (e) {
            this.setState({
                updateProfileState: 'error',
            })
            throw e
        }
    }

    handleRefresh = async () => {
        await auth.refreshUserInfo().then(() => {
            this.updateUserInfo()
        })
    }

    async updateUserInfo() {
        const user = await this.props.currentUser
        const plans = await this.props.currentUser.authorizedPlans
        const features = await this.props.currentUser.authorizedFeatures
        const isBetaAuthorized = await auth.isAuthorizedForFeature('beta')

        this.setState({
            plans: plans,
            features: features,
            loadState: 'success',
            isPioneer: isBetaAuthorized,
        })
    }

    render() {
        const user = this.props.currentUser
        const features = user?.authorizedFeatures
        const plans = user?.authorizedPlans

        return (
            <FullPage>
                {user != null && (
                    <div className={styles.AccountInfoBox}>
                        <PioneerPlanBanner width={'fill-available'}/>
                        {this.state.isPioneer &&
                            this.state.loadState === 'success' && (
                                <div className={styles.pioneerBox}>
                                    <div className={styles.pioneerTitle}>
                                        🚀 Pioneer Edition
                                    </div>
                                    <div className={styles.pioneerSubtitle}>
                                        You have beta features enabled.
                                    </div>
                                </div>
                            )}
                        {this.state.isPioneer && (
                            <>
                                <TypographyInputTitle>
                                        {' '}
                                        Display Name{' '}
                                </TypographyInputTitle>
                                <DisplayNameBox>
                                    <DisplayNameSetup
                                        name={this.state.newDisplayName}
                                        onChange={(newDisplayName) => {
                                            this.setState({ newDisplayName })
                                            console.log(newDisplayName)
                                        }}
                                        onClickNext={this.updateDisplayName}
                                    />
                                </DisplayNameBox>
                            </>
                        )}
                        <div className={styles.section}>
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
                        </div>
                        {!user.subscriptionStatus && (
                            <div className={styles.section}>
                                <TypographyInputTitle>
                                    {' '}
                                    Your Plan{' '}
                                </TypographyInputTitle>
                                <div className={styles.lineEditBox}>
                                    <InputTextField
                                        name={'Plans'}
                                        defaultValue={'Free Tier'}
                                        readOnly
                                    />
                                    <PrimaryAction
                                        onClick={
                                            this.props.showSubscriptionModal
                                        }
                                        label={'Upgrade'}
                                    />
                                </div>
                            </div>
                        )}

                        {this.state.plans.length > 0 && (
                            <div className={styles.section}>
                                <TypographyInputTitle>
                                    {' '}
                                    Your Plan{' '}
                                </TypographyInputTitle>
                                <div className={styles.lineEditBox}>
                                    <InputTextField
                                        name={'plan'}
                                        defaultValue={this.state.plans}
                                        readOnly
                                    />
                                    {this.state.loadingChargebee ||
                                    this.props.loadingUser ? (
                                        <PrimaryAction label={<LoadingIndicator />} onClick={() => null}/>
                                    ) : (
                                        <PrimaryAction
                                            onClick={this.openPortal}
                                            label={'Edit Subscriptions'}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        {user.subscriptionStatus &&
                            user.subscriptionStatus !== 'in_trial' &&
                            user.subscriptionStatus !== 'active' && (
                                <div className={styles.section}>
                                    <TypographyInputTitle>
                                        {' '}
                                        Subscription Status{' '}
                                    </TypographyInputTitle>
                                    <div className={styles.lineEditBox}>
                                        <InputTextField
                                            name={'subscriptionStatus'}
                                            defaultValue={
                                                user.subscriptionStatus
                                            }
                                            readOnly
                                        />
                                        <PrimaryAction
                                            onClick={this.openPortal}
                                            label={'Reactivate'}
                                        />
                                    </div>
                                </div>
                            )}

                        {user.subscriptionStatus === 'in_trial' && (
                            <div className={styles.section}>
                                <TypographyInputTitle>
                                    {' '}
                                    Subscription Status{' '}
                                </TypographyInputTitle>
                                <div className={styles.lineEditBox}>
                                    <InputTextField
                                        name={'subscriptionStatus'}
                                        defaultValue={user.subscriptionStatus}
                                        readOnly
                                    />
                                    <PrimaryAction onClick={this.openPortal}
                                        label={'Add Payment Methods'}
                                    />
                                </div>
                            </div>
                        )}

                        {user.subscriptionExpiry && (
                            <div className={styles.section}>
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
                                        {user.subscriptionStatus ===
                                        'in_trial' ? (
                                            <TypographyInputTitle>
                                                {' '}
                                                Trial Ends on{' '}
                                            </TypographyInputTitle>
                                        ) : (
                                            <TypographyInputTitle>
                                                {' '}
                                                Subscription Renewal Date{' '}
                                            </TypographyInputTitle>
                                        )}
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
                            {this.state.loadingChargebee ||
                            this.props.loadingUser ? (
                                <PrimaryAction label={<LoadingIndicator />} onClick={() => null}/>
                            ) : (
                                <PrimaryAction label={'Refresh Subscription Status'} onClick={this.handleRefresh}/>
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
