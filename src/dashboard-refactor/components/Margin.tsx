import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

interface MarginProps {
    x?: string
    y?: string
    left?: string
    right?: string
    top?: string
    bottom?: string
}

const MarginDiv = styled.div`
    ${(props) => {
        if (props.x) return `margin-left: ${props.x}; margin-right: ${props.x};`
        return `${props.left ? `margin-left: ${props.left};` : ``}${
            props.right ? `margin-right: ${props.right};` : ``
        }`
    }}
    ${(props) => {
        if (props.y) return `margin-top: ${props.y}; margin-bottom: ${props.y};`
        return `${props.top ? `margin-top: ${props.top};` : ``}${
            props.bottom ? `margin-bottom: ${props.bottom}` : ``
        }`
    }}
`

export default class Margin extends PureComponent<MarginProps> {
    render() {
        const { children, ...rest } = this.props
        return <MarginDiv {...rest}>{children}</MarginDiv>
    }
}
