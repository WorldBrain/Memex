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
    loadState: TaskState
    displayName?: string
    newDisplayName?: string
    updateProfileState: TaskState
}

export class AccountInfo extends React.Component<Props & AuthContextInterface> {
    state = {
        loadingChargebee: false,
        loadState: 'running',
        updateProfileState: 'pristine',
        newDisplayName: '',
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

        this.setState({
            loadState: 'success',
        })
    }

    render() {
        const user = this.props.currentUser

        return (
            <FullPage>
                {user != null && (
                    <div className={styles.AccountInfoBox}>
                        <PioneerPlanBanner width={'fill-available'} />
                            <div className={styles.section}>
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
                            </div>
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
                        <div className={styles.section}>
                            <TypographyInputTitle>
                                {' '}
                                User-ID{' '}
                            </TypographyInputTitle>
                            <InputTextField
                                type={'text'}
                                name={'User ID'}
                                defaultValue={user.id}
                                readOnly
                            />
                        </div>
                    </div>
                )}
            </FullPage>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(AccountInfo))
