import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { LoadingIndicator as Spinner } from 'src/common-ui/components'

const rotate = (rotation: number) => {
    return keyframes`0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(${rotation}deg);
    }`
}

interface IconProps {
    heightAndWidth: string
    path: string
    rotation: string
}

export const Icon = styled.div<IconProps>`
    ${(props) =>
        css`
            height: ${props.heightAndWidth};
            width: ${props.heightAndWidth};
        `};
    ${(props) =>
        css`
            ${props.path &&
            `background-image: url(${props.path});
            background-repeat: no-repeat;
            background-size: contain;
            background-position: center;`}
        `}
    ${(props) =>
        props.rotation &&
        css`
            animation: ${rotate(props.rotation)} 0.2s ease-in-out forwards;
        `}
`

export const LoadingContainer = ({ children }) => {
    const Container = styled.div`
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
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
        ${(props) =>
            css`
                background: ${props.backgroundColor
                    ? props.backgroundColor
                    : '#fff'};
            `};
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
