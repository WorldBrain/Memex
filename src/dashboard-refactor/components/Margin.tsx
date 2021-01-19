import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

interface MarginProps {
    horizontal?: string
    vertical?: string
    left?: string
    right?: string
    top?: string
    bottom?: string
}

const MarginDiv = styled.div`
    ${(props) => {
        if (props.horizontal)
            return `margin-left: ${props.horizontal}; margin-right: ${props.horizontal};`
        return `${props.left ? `margin-left: ${props.left};` : ``}${
            props.right ? `margin-right: ${props.right};` : ``
        }`
    }};
    ${(props) => {
        if (props.vertical)
            return `margin-top: ${props.vertical}; margin-bottom: ${props.vertical};`
        return `${props.top ? `margin-top: ${props.top};` : ``}${
            props.bottom ? `margin-bottom: ${props.bottom}` : ``
        }`
    }};
    display: flex;
    justify-content: center;
    align-items: center;
`

export default class Margin extends PureComponent<MarginProps> {
    render() {
        const { children, ...rest } = this.props
        return <MarginDiv {...rest}>{children}</MarginDiv>
    }
}
