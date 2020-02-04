import React from 'react'
import styled from 'styled-components'
import { colorMidPurple } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeNormal,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledLink = styled.div`
    cursor: pointer;
    display: inline-block;
`
const StyledLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeNormal}px;
    line-height: 18px;
    font-weight: normal;
    text-decoration-line: underline;
    color: ${colorMidPurple};
`
export const Link = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <StyledLink onClick={onClick}>
        <StyledLinkText>{label}</StyledLinkText>
    </StyledLink>
)
