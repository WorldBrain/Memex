import React from 'react'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeTitle,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledExternalLink = styled.a`
    cursor: pointer;
    display: inline-block;
`
const StyledExternalLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeTitle}px;
    text-decoration-line: underline;
    font-weight: normal;
    color: ${colorText};
    margin-right: 4px;
    &::after {
        content: '↗';
        text-decoration-line: none;
    }
`
export const ExternalLink = ({
    label,
    href,
}: {
    label: string
    href: string
}) => (
    <StyledExternalLink target="_blank" href={href}>
        <StyledExternalLinkText>{label}</StyledExternalLinkText>
    </StyledExternalLink>
)
