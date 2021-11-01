import * as React from 'react'
import styled from 'styled-components'

import { TypographyInputTitle } from 'src/common-ui/components/design-library/typography'
import { FullPage } from 'src/common-ui/components/design-library/FullPage'
import { InputTextField } from 'src/common-ui/components/design-library/form/InputTextField'
import { AuthContextInterface } from 'src/authentication/background/types'
import { auth } from 'src/util/remote-functions-background'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'
import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'

const styles = require('./styles.css')

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
    refreshUser?: boolean
}

export class AccountInfo extends React.Component<Props & AuthContextInterface> {
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
                                    authBG={auth}
                                    refreshUserInfoOnInit
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
