import React from 'react'
import styled, { css, keyframes } from 'styled-components'

const rotate = (rotation: Number) => {
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
    plus90: boolean
    minus90: boolean
}

export const Icon = styled.div<IconProps>`
    ${(props) =>
        css`
            height: ${props.xy};
            width: ${props.xy};
        `};
    ${(props) =>
        css`
            ${props.path && `background-image: url(${props.path})`};
        `}
    ${(props) =>
        props.plus90 &&
        css`
            animation: ${rotate(90)} 1s ease-in 1;
        `}
    ${(props) =>
        props.minus90 &&
        css`
            animation: ${rotate(-90)} 1s ease-in 1;
        `}
`
