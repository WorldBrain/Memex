import React from 'react'
import styled, { css } from 'styled-components'
import {
    colorDisabled,
    colorPrimary,
} from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'
import { ColorThemeKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

const StyledPrimaryAction = styled.div<{
    backgroundColor: ColorThemeKeys
}>`
    padding: 8px 20px;
    height: 35px;
    font-weight: 600;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) =>
        props.disabled
            ? props.theme.colors.darkHover
            : props.theme.colors.normalText};
    background: ${(props) =>
        props.backgroundColor
            ? props.backgroundColor
            : props.theme.colors.normalText};
    box-sizing: border-box;
    border-radius: 5px;
    cursor: pointer;

    :focus {
        outline: unset;
    }

    &:hover {
        opacity: 0.8;
    }

    ${(props) =>
        props.disabled &&
        css`
            color: ${(props) => props.theme.colors.greyScale8};
            background: ${(props) => props.theme.colors.lightHover};
        `};
`

const StyledPrimaryActionLinkText = styled(TypographyActionText)<{
    fontSize: string
    fontColor: ColorThemeKeys
}>`
    font-size: ${(props) => (props.fontSize ? props.fontSize : fontSizeSmall)};
    color: ${(props) =>
        props.fontColor ? props.fontColor : props.theme.colors.backgroundColor};
    font-weight: 600;
    font-family: 'Satoshi';
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
    fontSize,
    backgroundColor,
    fontColor,
}: {
    label: React.ReactNode
    onClick: React.MouseEventHandler
    disabled?: boolean
    innerRef?: any
    fontSize?: string
    backgroundColor?: ColorThemeKeys
    fontColor?: ColorThemeKeys
}) => (
    <StyledPrimaryAction
        autoFocus
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick(e) : false)}
        backgroundColor={(props) => props.theme.colors[backgroundColor]}
        fontColor={fontColor}
    >
        <StyledPrimaryActionLinkText fontSize={fontSize}>
            {label}
        </StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
