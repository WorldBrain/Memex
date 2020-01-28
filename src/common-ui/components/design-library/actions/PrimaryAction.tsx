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

const StyledPrimaryAction = styled.div`
    padding: 10px 20px;
    background: ${props => (props.disabled ? colorDisabled : colorPrimary)};
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
    white-space: nowrap;
`
const StyledPrimaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: #545454;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
}) => (
    <StyledPrimaryAction
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
    >
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
