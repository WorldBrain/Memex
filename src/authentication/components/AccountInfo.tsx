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
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import Logic from './UserScreen/logic'
import type { State, Event, Dependencies } from './UserScreen/types'
import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

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
                        <PioneerPlanBanner width={'fill-available'} />
                        <Section>
                            <SectionCircle>
                                <Icon
                                    filePath={icons.personFine}
                                    heightAndWidth="34px"
                                    color="purple"
                                    hoverOff
                                />
                            </SectionCircle>
                            <SectionTitle>My Account</SectionTitle>
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
                                <DisplayNameBox>
                                    <TextInputContainerDisabled>
                                        <Icon
                                            filePath={icons.personFine}
                                            heightAndWidth="20px"
                                            hoverOff
                                        />
                                        <TextInput
                                            type={'text'}
                                            name={'User ID'}
                                            defaultValue={
                                                this.state.currentUser.id
                                            }
                                            readOnly
                                        />
                                    </TextInputContainerDisabled>
                                    <InfoText>
                                        Your internal user ID for support
                                        requests
                                    </InfoText>
                                </DisplayNameBox>
                                <PrimaryAction
                                    label="Reset Password"
                                    onClick={() => {
                                        this.props.setAuthMode(
                                            'ConfirmResetPassword',
                                        )
                                        this.props.authBG.sendPasswordResetEmailProcess(
                                            this.state.currentUser.email,
                                        )
                                    }}
                                    font-size="14px"
                                />
                            </FieldsContainer>
                        </Section>
                    </>
                ) : (
                    <Section>
                        <LoadingIndicatorBox>
                            <LoadingIndicator />
                        </LoadingIndicatorBox>
                    </Section>
                )}
            </FullPage>
        )
    }
}

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
    width: 400px;
    margin-top: 30px;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const DisplayNameContainer = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 12px;
    opacity: 0.7;
    padding-left: 10px;
    margin-top: 5px;
`

const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: fill-available;
    padding: 0 15px;
`

const TextInputContainerDisabled = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: fill-available;
    padding: 0 15px;
`

const TextInput = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) =>
        props.readOnly
            ? props.theme.colors.lighterText
            : props.theme.colors.normalText};
    font-size: 14px;
    border: none;
    background: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.lighterText};
    }
`
