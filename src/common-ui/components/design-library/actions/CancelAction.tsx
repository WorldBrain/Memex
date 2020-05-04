import React from 'react'
import styled from 'styled-components'
import {
    colorDisabled,
    colorPrimary,
    colorError,
} from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledCancelAction = styled.div`
    padding: 6px 12px;
    background: ${(props) => (props.disabled ? colorDisabled : colorError)};
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
`
const StyledCancelActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: #ffffff;
`
export const CancelAction = ({
    label,
    onClick,
    disabled,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
}) => (
    <StyledCancelAction
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
    >
        <StyledCancelActionLinkText>{label}</StyledCancelActionLinkText>
    </StyledCancelAction>
)
