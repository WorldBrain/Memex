import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { LoadingIndicator } from 'src/common-ui/components'
import {
    TypographyHeadingBig,
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographySubTextNormal,
    TypographyHeadingNormal,
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

import { formBackground } from 'src/common-ui/components/design-library/colors'

interface BetaFeatureNotifProps {
    showSubscriptionModal: () => void
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
    margin-bottom: 30px;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & > div {
        display: flex;
        justify-content: center;
    }

    & span {
        text-align: center;
    }
`

const ButtonBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 220px;
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

export default class BetaFeatureNotif extends PureComponent<
    BetaFeatureNotifProps
> {
    render() {
        return (
            <div>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            🚀 This is a beta feature
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            Upgrade to the Pioneer Plan to get early access to Beta Features
                        </TypographyTextNormal>
                        <Margin/>
                        <>
                        <ButtonBox>
                            <PrimaryAction
                                onClick={this.props.showSubscriptionModal}
                                label={'Upgrade'}
                            />
                            <SecondaryAction
                                onClick={()=> window.open('https://worldbrain.io/tutorials/sharing-features')}
                                label={'Watch Demo'}
                            />
                        </ButtonBox>
                        </>
                    </InstructionsBox>
                </InstructionsContainer>
            </div>
        )
    }
}
