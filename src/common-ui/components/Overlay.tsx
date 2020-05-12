import React, { Component, MouseEventHandler } from 'react'
import ReactDOM from 'react-dom'
import styled, { StyleSheetManager } from 'styled-components'

export interface Props {
    rootEl?: string
    rootElId?: string
    className?: string
    innerClassName?: string
    onClick?: MouseEventHandler
}

class Overlay extends Component<Props> {
    static DEF_ROOT_EL = 'div'

    static defaultProps = {
        rootEl: Overlay.DEF_ROOT_EL,
    }

    private overlayRoot: HTMLElement

    constructor(props) {
        super(props)

        this.overlayRoot = document.createElement(props.rootEl)
    }

    componentDidMount() {
        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        if (document.body.contains(this.overlayRoot)) {
            document.body.removeChild(this.overlayRoot)
        }
    }

    handleClick = (event) =>
        this.props.onClick ? this.props.onClick(event) : null

    handleInnerClick = (event) => event.stopPropagation()

    render() {
        const { className, innerClassName, onClick, children } = this.props

        return ReactDOM.createPortal(
            <StyleSheetManager target={this.overlayRoot}>
                <OuterDiv className={className} onClick={this.handleClick}>
                    <div
                        className={innerClassName}
                        onClick={this.handleInnerClick}
                    >
                        {children}
                    </div>
                </OuterDiv>
            </StyleSheetManager>,
            this.overlayRoot,
        )
    }
}

export default Overlay

export const OuterDiv = styled.div`
    display: flex;
    flex-direction: row;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483646;
    background: rgba(0, 0, 0, 0.3);
    cursor: ${(props) => (props.onClick == null ? 'default' : 'pointer')};
    justify-content: center;
    align-items: center;
`
