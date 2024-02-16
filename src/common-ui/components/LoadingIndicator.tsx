import React, { PureComponent } from 'react'
import { keyframes } from 'styled-components'
import styled from 'styled-components'

const styles = require('./LoadingIndicator.css')

export interface Props {
    className?: string
    size?: string
}

class LoadingIndicator extends PureComponent<Props> {
    render() {
        return <Loader size={this.props.size} className={styles.loader} />
    }
}

const load = () => {
    return keyframes`0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }`
}

const Loader = styled.div<{ size: string }>`
    display: block;
    position: relative;
    font-size: 10px;
    text-indent: -9999em;
    width: ${(props) => (props.size ? props.size : '24px')};
    height: ${(props) => (props.size ? props.size : '24px')};
    border-radius: 50%;
    background: #99879f;
    background: gradient(left, #99879f 10%, rgba(60, 46, 71, 0) 42%);
    background: linear-gradient(to right, #99879f 10%, rgba(60, 46, 71, 0) 42%);
    animation: load 1.4s infinite linear;
    transform: translateZ(0);
    animation: ${load} 1.4s infinite linear forwards;

    &::before {
        border-radius: 100% 0 0 0;
        position: absolute;
        top: 0;
        left: 0;
        content: '';
    }

    &::after {
        background: #fff;
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

export default LoadingIndicator
