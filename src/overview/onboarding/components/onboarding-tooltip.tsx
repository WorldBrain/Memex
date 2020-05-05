import React from 'react'
import styled from 'styled-components'
import ProgressStepContainer from 'src/common-ui/components/progress-step-container'
import { TypographyBodyCenter } from 'src/common-ui/components/design-library/typography'
import {
    colorMidPurple,
    colorGrey9,
} from 'src/common-ui/components/design-library/colors'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

export interface Props {
    imgSrc?: string
    CTAText?: string
    title: string
    subtitle?: string
    onCTAClick?: () => void
}

export default class OnboardingTooltip extends React.PureComponent<Props> {
    private renderCTAButton() {
        if (!this.props.CTAText || !this.props.onCTAClick) {
            return
        }

        return (
            <SecondaryAction
                onClick={this.props.onCTAClick}
                label={this.props.CTAText}
            />
        )
    }

    private renderImg() {
        if (!this.props.imgSrc) {
            return
        }

        return (
            <StyledImage>
                <img src={this.props.imgSrc} />
            </StyledImage>
        )
    }

    render() {
        return (
            <StyledOnboardingTooltip>
                <Title>{this.props.title}</Title>
                <Subtitle>{this.props.subtitle}</Subtitle>
                <TypographyBodyCenter>
                    {this.props.children}
                </TypographyBodyCenter>
                {this.renderImg()}
                {this.renderCTAButton()}
                <ProgressWrapper>
                    <ProgressStepContainer
                        totalSteps={5}
                        currentStep={4}
                        onStepClick={() => undefined}
                    />
                    <NextLink>Next</NextLink>
                </ProgressWrapper>
            </StyledOnboardingTooltip>
        )
    }
}

const StyledOnboardingTooltip = styled.div`
    font-family: 'Poppins', sans-serif;
    max-width: 600px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Subtitle = styled(TypographyBodyCenter)`
    color: ${colorGrey9};
    font-weight: 600;
`
const Title = styled(TypographyBodyCenter)`
    color: ${colorMidPurple};
    font-weight: 600;
    margin-bottom: 20px;
`
const StyledImage = styled.div`
    margin: 20px 0;
`

const ProgressWrapper = styled.div`
    margin: 10px 0;
    display: flex;
`

const NextLink = styled.a`
    align-items: center;
    color: ${colorMidPurple};
    font-weight: 600;
    cursor: pointer;
    margin: 1rem 0 0 0.5rem;
`
