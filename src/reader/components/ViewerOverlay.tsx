import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

const modalRoot = document.getElementById('app')

interface Props {
    children: any
    handleClose: () => void
}

export default class ViewerOverlay extends React.PureComponent<Props> {
    el: HTMLElement

    constructor(props) {
        super(props)
        this.el = document.createElement('div')
    }

    componentDidMount() {
        modalRoot.appendChild(this.el)
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el)
    }

    render() {
        return ReactDOM.createPortal(this.renderContent(), this.el)
    }

    renderContent() {
        return (
            <Wrapper>
                <CloseButton onClick={this.props.handleClose} />

                <Inner>
                    <div>{this.props.children}</div>
                </Inner>
            </Wrapper>
        )
    }
}

const Wrapper = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    background-color: rgba(0, 0, 0, 0.2);
    height: 100vh;
    width: 100vw;
    z-index: 9999;
    padding-left: 1rem;
    padding-right: 1rem;
`
const Inner = styled.div`
    padding: 4rem;
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    background-color: white;
    overflow-y: scroll;
`

const CloseButton = styled.button`
    position: absolute;
    top: 1rem;
    right: 3rem;
    background-size: 14px;
    width: 22px;
    height: 22px;
    border: none;
    transition: all 200ms;
    cursor: pointer;
    background-color: transparent;
    background-image: url('/img/close.svg');
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 3px;
    z-index: 9999;
`
