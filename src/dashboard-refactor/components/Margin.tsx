import React, { MouseEventHandler, PureComponent } from 'react'
import styled, { css } from 'styled-components'

interface MarginProps {
    horizontal?: string
    vertical?: string
    left?: string
    right?: string
    top?: string
    bottom?: string
    width?: string
    height?: string
    onMouseOver?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
    onMouseEnter?: (e: React.MouseEvent) => void
    onClick?: () => void | MouseEventHandler<Element>
}

const MarginDiv = styled.div<MarginProps>`
    ${(props) => {
        if (props.horizontal) {
            return `margin-left: ${props.horizontal}; margin-right: ${props.horizontal};`
        }

        return `${props.left ? `margin-left: ${props.left};` : ``}${
            props.right ? `margin-right: ${props.right};` : ``
        }`
    }};
    ${(props) => {
        if (props.vertical) {
            return `margin-top: ${props.vertical}; margin-bottom: ${props.vertical};`
        }

        return `${props.top ? `margin-top: ${props.top};` : ``}${
            props.bottom ? `margin-bottom: ${props.bottom}` : ``
        }`
    }};
    display: flex;
    justify-content: center;
    align-items: center;
    ${(props) => {
        if (props.width) {
            return `width: ${props.width};`
        } else {
            return `width: 100%;`
        }
    }};
    ${(props) => {
        if (props.height) {
            return `width: ${props.height};`
        }
    }};
`

export default class Margin extends PureComponent<MarginProps> {
    render() {
        const { children, ...rest } = this.props
        return <MarginDiv {...rest}>{children}</MarginDiv>
    }
}
