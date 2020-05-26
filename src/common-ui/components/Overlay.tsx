import React, { Component, MouseEventHandler } from 'react'
import ReactDOM from 'react-dom'
import styled, { StyleSheetManager } from 'styled-components'
import { IGNORE_CLICK_OUTSIDE_CLASS } from 'src/content-scripts/constants'

export interface Props {
    rootEl?: string
    rootElId?: string
    className?: string
    innerClassName?: string
    requiresExplicitStyles?: boolean
    skipIgnoreClickOutside?: boolean
    ignoreClickOutsideClassName?: string
    onClick?: MouseEventHandler
}

class Overlay extends Component<Props> {
    static DEF_ROOT_EL = 'div'

    static defaultProps = {
        rootEl: Overlay.DEF_ROOT_EL,
        ignoreClickOutsideClassName: IGNORE_CLICK_OUTSIDE_CLASS,
    }

    private overlayRoot: HTMLElement

    constructor(props) {
        super(props)

        this.overlayRoot = document.createElement(props.rootEl)

        if (!props.skipIgnoreClickOutside) {
            this.overlayRoot.classList.add(props.ignoreClickOutsideClassName)
        }
    }

    componentDidMount() {
        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        if (document.body.contains(this.overlayRoot)) {
            document.body.removeChild(this.overlayRoot)
        }
    }

    handleInnerClick = (event) => event.stopPropagation()

    renderMain() {
        const { className, innerClassName, children } = this.props

        return (
            <OuterDiv className={className} onClick={this.props.onClick}>
                <div className={innerClassName} onClick={this.handleInnerClick}>
                    {children}
                </div>
            </OuterDiv>
        )
    }

    render() {
        if (this.props.requiresExplicitStyles) {
            return ReactDOM.createPortal(
                <StyleSheetManager target={this.overlayRoot}>
                    {this.renderMain()}
                </StyleSheetManager>,
                this.overlayRoot,
            )
        }

        return ReactDOM.createPortal(this.renderMain(), this.overlayRoot)
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
    cursor: ${(props) => (props.onClick ? 'default' : 'pointer')};
    justify-content: center;
    align-items: center;
`
