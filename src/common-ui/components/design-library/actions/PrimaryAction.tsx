import React from 'react'
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
    height: 36px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) => props.disabled ? colorDisabled : props.theme.colors.purple};

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
    color: white;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
}: {
    label: React.ReactNode
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
