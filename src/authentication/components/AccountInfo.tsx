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
import UpdateEmail from 'src/overview/sharing/components/UpdateEmail'
import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import Logic from './UserScreen/logic'
import type { State, Event, Dependencies } from './UserScreen/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

const styles = require('./styles.css')

const DisplayNameBox = styled.div`
    width: fill-available;
`

export interface Props extends Dependencies {
    setAuthMode: (mode) => void
}

export default class UserScreen extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Pick<
        Props,
        'navToDashboard' | 'authBG' | 'personalCloudBG' | 'navToGuidedTutorial'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
        navToDashboard: () => {},
        navToGuidedTutorial: () => {},
    }

    async componentDidMount() {
        const user = await this.props.authBG.getCurrentUser()
        this.processEvent('getCurrentUser', { currentUser: user })
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    render() {
        return (
            <FullPage>
                {this.state.currentUser != null ? (
                    <>
                        <SettingSection
                            title={'My Account'}
                            icon={'personFine'}
                        >
                            <FieldsContainer>
                                <DisplayNameBox>
                                    <DisplayNameSetup authBG={auth} />
                                </DisplayNameBox>
                                <DisplayNameBox>
                                    <UpdateEmail
                                        authBG={auth}
                                        email={this.state.currentUser.email}
                                    />
                                </DisplayNameBox>
                                <UserIdField>
                                    <Icon
                                        filePath={icons.personFine}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    {this.state.currentUser.id}
                                </UserIdField>
                                <InfoText>
                                    Your internal user ID for support requests
                                </InfoText>

                                {this.state.passwordResetSent ? (
                                    <ConfirmationMessage>
                                        <Icon
                                            icon="mail"
                                            heightAndWidth="22px"
                                            color="prime1"
                                        />
                                        Check your email inbox:{' '}
                                        <strong>
                                            {this.state.currentUser.email}
                                        </strong>
                                    </ConfirmationMessage>
                                ) : (
                                    <PrimaryAction
                                        label={'Reset Password'}
                                        onClick={() => {
                                            this.processEvent(
                                                'sendPasswordReset',
                                                null,
                                            )
                                            this.props.setAuthMode(
                                                'ConfirmResetPassword',
                                            )
                                        }}
                                        size={'medium'}
                                        type={'secondary'}
                                    />
                                )}
                            </FieldsContainer>
                        </SettingSection>
                    </>
                ) : (
                    <SettingSection title={'My Account'} icon={'personFine'}>
                        <LoadingIndicatorBox>
                            <LoadingIndicator />
                        </LoadingIndicatorBox>
                    </SettingSection>
                )}
            </FullPage>
        )
    }
}

const ConfirmationMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.greyScale5};
    font-size: 14px;
`

const LoadingIndicatorBox = styled.div`
    padding: 100px 50px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const FieldsContainer = styled.div`
    display: flex;
    grid-gap: 20px;
    flex-direction: column;
    align-items: flex-start;
    width: 440px;
    margin-top: 15px;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    opacity: 0.7;
    padding-left: 10px;
    margin-top: -15px;
    margin-bottom: 15px;
`

const UserIdField = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale6};
    background: transparent;
    height: 44px;
    border-radius: 5px;
    width: fill-available;
    padding: 0 15px;
    font-size: 14px;
`
