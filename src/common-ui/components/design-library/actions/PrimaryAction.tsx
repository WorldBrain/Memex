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
    height: 35px;
    font-weight: 400;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) =>
        props.disabled ? colorDisabled : props.theme.colors.purple};

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

const StyledPrimaryActionLinkText = styled(TypographyActionText)<{
    fontSize: string
}>`
    font-size: ${(props) => (props.fontSize ? props.fontSize : fontSizeSmall)};
    color: white;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
    fontSize,
}: {
    label: React.ReactNode
    onClick: React.MouseEventHandler
    disabled?: boolean
    innerRef?: any
    fontSize?: string
}) => (
    <StyledPrimaryAction
        autoFocus
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick(e) : false)}
    >
        <StyledPrimaryActionLinkText fontSize={fontSize}>
            {label}
        </StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
