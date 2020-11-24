import { StringChain } from 'lodash'
import React from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import styled, { css, keyframes } from 'styled-components'
import Margin from './components/Margin'

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

interface LoadingContainerProps {
    top?: string
    bottom?: string
    left?: string
    right?: string
    horizontal?: string
    vertical?: string
    backgroundColor: string
}

export const renderLoadingContainer = (props: LoadingContainerProps) => {
    const LoadingContainer = styled(Margin)<LoadingContainerProps>`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    `
    const Spinner = styled(LoadingIndicator)`
        ${(props) =>
            css`
                &::after {
                    background: ${props.backgroundColor};
                }
            `}
    `
    return (
        <LoadingContainer {...props}>
            <Spinner />
        </LoadingContainer>
    )
}
