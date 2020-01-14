import React from 'react'
import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledPrimaryAction = styled.div`
    padding: 15px;
    background: ${colorPrimary};
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
`
const StyledPrimaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: #fafafb;
`
export const PrimaryAction = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <StyledPrimaryAction onClick={onClick}>
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
