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
    font-size: inherit;
    color: inherit;
    font-family: inherit;
`
const StyledExternalLinkText = styled(TypographyActionText)`
    font-size: inherit;
    text-decoration-line: underline;
    font-weight: normal;
    font-family: inherit;
    color: inherit;
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
