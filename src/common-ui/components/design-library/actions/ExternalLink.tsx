import React from 'react'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeNormal,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledExternalLink = styled.div`
    cursor: pointer;
    display: inline-block;
`
const StyledExternalLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeNormal}px;
    text-decoration-line: underline;
    font-weight: normal;
    color: ${colorText};

    &::after {
        content: '↗';
        margin: 0 5px;
        text-decoration-line: none;
    }
`
export const ExternalLink = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <StyledExternalLink onClick={onClick}>
        <StyledExternalLinkText>{label}</StyledExternalLinkText>
    </StyledExternalLink>
)
