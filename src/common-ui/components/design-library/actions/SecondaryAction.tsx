import React from 'react'
import styled from 'styled-components'
import { colorMidPurple } from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledSecondaryAction = styled.div`
    padding: 15px;
    border: 1px solid ${colorMidPurple};
    box-sizing: border-box;
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
`
const StyledSecondaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: ${colorMidPurple};
`
export const SecondaryAction = ({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) => (
    <StyledSecondaryAction onClick={onClick}>
        <StyledSecondaryActionLinkText>{label}</StyledSecondaryActionLinkText>
    </StyledSecondaryAction>
)
