import React from 'react'
import styled from 'styled-components'
import { colorDarkText } from 'src/common-ui/components/design-library/colors'

const StyledTip = styled.div`
    border-radius: 4px;
    background-color: ${colorDarkText};
    padding: 5px;
`
const StyledTipLinkText = styled.span`
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 15px;
    color: #ffffff;
`
export const Tip = ({
    children,
    onClick,
}: {
    children: any
    onClick?: () => void
}) => (
    <StyledTip onClick={onClick}>
        <StyledTipLinkText>{children}</StyledTipLinkText>
    </StyledTip>
)
