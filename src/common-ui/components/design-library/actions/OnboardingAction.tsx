import React from 'react'
import styled from 'styled-components'
import {
    colorDisabled,
    colorPrimary,
} from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledOnboardingAction = styled.div`
    padding: 15px 30px;
    background: ${props => (props.disabled ? colorDisabled : colorPrimary)};
    border-radius: 50px;
    cursor: pointer;
    display: inline-block;
    white-space: nowrap;
`
const StyledOnboardingActionLinkText = styled(TypographyActionText)`
    font-size: 15px;
    color: white;
    vertical-align: middle;
`
export const OnboardingAction = ({
    label,
    onClick,
    disabled,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
}) => (
    <StyledOnboardingAction
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
    >
        <StyledOnboardingActionLinkText>{label}</StyledOnboardingActionLinkText>
    </StyledOnboardingAction>
)
