import React from 'react'
import styled from 'styled-components'
import { ExternalLink as ExternalLinkIcon } from '@styled-icons/feather'
import { colorText } from 'src/common-ui/components/design-library/colors'
import { darken } from 'polished'

const StyledExternalLink = styled.a`
    font-family: Poppins;
    cursor: pointer;
    display: inline-block;
    text-decoration-line: underline;
    color: ${colorText};
    font-weight: 500;
    margin-right: 4px;
    &:hover {
        color: ${(props) => darken(0.3, colorText)};
    }
`
export const ExternalLink = ({
    label,
    href,
}: {
    label: string
    href: string
}) => (
    <StyledExternalLink target="_blank" href={href} rel="noopener noreferrer">
        {label}
        <StyledExternalLinkIcon size={18} />
    </StyledExternalLink>
)

export const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
    stroke-width: 2px;
    position: relative;
    top: -3px;
    margin-left: 2px;
`
