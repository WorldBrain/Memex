import { ColorThemeKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import React from 'react'
import styled, { css, keyframes } from 'styled-components'

const rotate = (rotation: number) => {
    return keyframes`0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(${rotation}deg);
    }`
}

export interface IconProps {
    heightAndWidth?: string
    path?: string
    rotation?: number
    faded?: boolean
    paddingHorizontal?: string
    color?: ColorThemeKeys
    bgColor?: string
    onClick?: any
    hoverOff?: boolean
}

const IconContainer = styled.div<IconProps>`
    padding: 4px;
    display: flex;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background-color: ${(props) =>
            props.hoverOff ? 'none' : props.theme.colors.greyScale2};
    }
`

const IconInner = styled.div<IconProps>`
        ${(props) =>
            css`
                height: ${props.heightAndWidth};
                width: ${props.heightAndWidth};
            `};
        ${(props) =>
            css`
                ${props.path &&
                `mask-image: url(${props.path});
                mask-repeat: no-repeat;
                mask-size: contain;
                mask-position: center;
                background-color: ${
                    props.color
                        ? props.theme.colors[props.color]
                        : props.theme.colors['greyScale4']
                };
                `}
            `}
        ${(props) =>
            props.rotation &&
            css`
                animation: ${rotate(props.rotation)} 0.2s ease-in-out forwards;
                animation-fill-mode: forwards;
            `}
        ${(props) =>
            props.faded &&
            css`
                opacity: 0.5;
            `}
        ${(props) =>
            props.paddingHorizontal &&
            css`
                padding-left: ${props.paddingHorizontal};
                padding-right: ${props.paddingHorizontal};
            `}
        flex: none;
        `

export const Icon = (props: IconProps) => {
    return (
        <IconContainer onClick={props.onClick} {...props}>
            <IconInner {...props} />
        </IconContainer>
    )
}

export const LoadingContainer = ({ children }) => {
    const Container = styled.div`
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        grid-gap: 20px;
        color: ${(props) => props.theme.colors.greyScale6};
        font-size: 20px;
        height: 100%;
    `
    return <Container>{children}</Container>
}

const loadingRotation = keyframes`
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
`

export const LoadingIndicator = styled.div<{ backgroundColor: string }>`
    display: block;
    position: relative;
    font-size: 10px;
    text-indent: -9999em;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #99879f;
    background: gradient(left, #99879f 10%, rgba(60, 46, 71, 0) 42%);
    background: linear-gradient(to right, #99879f 10%, rgba(60, 46, 71, 0) 42%);
    animation: ${loadingRotation} 1.4s infinite linear;
    transform: translateZ(0);

    &::before {
        border-radius: 100% 0 0 0;
        position: absolute;
        top: 0;
        left: 0;
        content: '';
    }

    &::after {
        width: 65%;
        height: 65%;
        border-radius: 50%;
        content: '';
        margin: auto;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
    }
`
