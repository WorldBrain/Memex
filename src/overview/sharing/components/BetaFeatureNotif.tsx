import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { auth, subscription } from 'src/util/remote-functions-background'
import {
    TypographyTextNormal,
    TypographyHeadingBigger,
} from 'src/common-ui/components/design-library/typography'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { formBackground } from 'src/common-ui/components/design-library/colors'

export interface Props {
    showSubscriptionModal: () => void
}

interface State {
    isPioneer: boolean
    hasSubscription: boolean
    loadingChargebee: boolean
}

const NameInput = styled.input`
    background-color: ${formBackground};
    border-radius: 3px;
    outline: none;
    border: none;
    width: 300px;
    height: 35px;
    margin: 0 0 20px 0;
    text-align: center;
`
const InstructionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & > div {
        display: flex;
        justify-content: space-between;
    }

    & span {
        text-align: center;
    }
`

const ButtonBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 290px;
    align-items: center;
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const TypographyTextNormalAlert = styled(TypographyTextNormal)`
    color: red;
`

const Margin = styled.div`
    margin-bottom: 20px;
`

const InfoBox = styled.div`
    padding: 15px 30px;
    display: flex;
    justify-content: center;
    align-item: center;
    margin-top: 30px;
    background: #f29d9d;
    border-radius: 5px;

    & strong {
        margin-right: 5px;
    }
`

export default class BetaFeatureNotif extends PureComponent<Props, State> {
    state: State = {
        loadingChargebee: false,
        hasSubscription: false,
        isPioneer: false,
    }

    get isUnauthorizedUser(): boolean {
        return this.state.hasSubscription && !this.state.isPioneer
    }

    componentDidMount() {
        this.upgradeState()
    }

    private openPortal = async () => {
        this.setState({ loadingChargebee: true })
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
        this.setState({ loadingChargebee: false })
    }

    private async upgradeState() {
        const plans = await auth.getAuthorizedPlans()
        const isBetaAuthorized = await auth.isAuthorizedForFeature('beta')

        this.setState({
            isPioneer: isBetaAuthorized,
            hasSubscription: plans.length > 0,
        })
    }

    render() {
        return (
            <div>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            🚀 This is a beta feature
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            Request access to join the Pioneer community to use
                            it. <br />
                            Instantly use them by upgrading to the Pioneer Plan
                            via 'Settings > Beta Features'.
                        </TypographyTextNormal>
                        <Margin />
                        <>
                            <ButtonBox>
                                <PrimaryAction
                                    label="Request Free Access"
                                    onClick={
                                        this.isUnauthorizedUser
                                            ? this.openPortal
                                            : () => {
                                                  window.open(
                                                      'https://worldbrain.io/request-early-access',
                                                  )
                                              }
                                    }
                                />
                                <SecondaryAction
                                    label="Watch Demo"
                                    onClick={() =>
                                        window.open(
                                            'https://worldbrain.io/tutorials/sharing-features',
                                        )
                                    }
                                />
                            </ButtonBox>
                            {this.isUnauthorizedUser && (
                                <InfoBox>
                                    To upgrade go to "Edit Subscription" and add
                                    the "Pioneer Support" addon
                                </InfoBox>
                            )}
                        </>
                    </InstructionsBox>
                </InstructionsContainer>
            </div>
        )
    }
}
