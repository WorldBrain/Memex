import React, { ReactNode } from 'react'
import styled from 'styled-components'
import {
    colorDisabled,
    colorPrimary,
} from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledPrimaryAction = styled.div`
    padding: 8px 20px;
    border: 1px solid ${colorPrimary};
    height: 35px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center
    vertical-align: middle;
    background: ${(props) => (props.disabled ? colorDisabled : colorPrimary)};

    box-sizing: border-box;
    border-radius: 5px;
    cursor: pointer;

    :focus {
        outline: unset;
    }

    &: hover {
        opacity: 0.8;
    }
`

const StyledPrimaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: #2f2f2f;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
}: {
    label: ReactNode
    onClick: () => void
    disabled?: boolean
    innerRef?: any
}) => (
    <StyledPrimaryAction
        autoFocus
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
