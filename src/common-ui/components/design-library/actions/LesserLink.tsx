import React from 'react'
import styled from 'styled-components'
import { colorText } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeNormal,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledLesserLink = styled.div`
    cursor: pointer;
    display: inline-block;
`
const StyledLesserLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeNormal}px;
    text-decoration-line: underline;
    font-weight: normal;
    color: ${colorText};
`
export const LesserLink = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <StyledLesserLink onClick={onClick}>
        <StyledLesserLinkText>{label}</StyledLesserLinkText>
    </StyledLesserLink>
)
