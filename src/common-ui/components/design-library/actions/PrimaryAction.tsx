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

const Button = styled.button`
    /* Reset browser button styles */

    border: none;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;

    background: transparent;

    /* inherit font & color from ancestor */
    color: inherit;
    font: inherit;

    /* Normalize \`line-height\`. Cannot be changed from \`normal\` in Firefox 4+. */
    line-height: normal;

    /* Corrects font smoothing for webkit */
    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;

    /* Corrects inability to style clickable \`input\` types in iOS */
    -webkit-appearance: none;

    :focus {
        outline: unset;
    }
`

const StyledPrimaryAction = styled(Button)`
    padding: 10px 20px;
    background: ${props => (props.disabled ? colorDisabled : colorPrimary)};
    border-radius: 5px;
    cursor: pointer;
    display: inline-block;
    white-space: nowrap;
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
    label: string
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
        onKeyPress={e => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
