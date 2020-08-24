import React, { Component, MouseEventHandler } from 'react'
import ReactDOM from 'react-dom'
import styled, { StyleSheetManager } from 'styled-components'
import { IGNORE_CLICK_OUTSIDE_CLASS } from 'src/content-scripts/constants'

export interface Props {
    large?: boolean
    rootEl?: string
    rootElId?: string
    className?: string
    innerClassName?: string
    /** If set, renders a wrapping `StyleSheetManager` component. Use if rendering in content-script! */
    requiresExplicitStyles?: boolean
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
        this.overlayRoot.classList.add(props.ignoreClickOutsideClassName)
    }

    componentDidMount() {
        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        if (document.body.contains(this.overlayRoot)) {
            document.body.removeChild(this.overlayRoot)
        }
    }

    private handleInnerClick = (event) => event.stopPropagation()

    private renderMain() {
        const { className, innerClassName, children } = this.props

        return (
            <OuterDiv className={className} onClick={this.props.onClick}>
                <InnerDiv
                    className={innerClassName}
                    onClick={this.handleInnerClick}
                    large={this.props.large}
                >
                    {children}
                </InnerDiv>
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
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    justify-content: center;
    align-items: center;
`

export const InnerDiv = styled.div`
    /* elements.css .toolTips */
    border-radius: 3px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    background: white;
    overflow: hidden;
    overflow-y: scroll;

    background: #fff;
    min-width: 500px;
    min-height: 200px;
    padding: 20px;
    position: relative;
    transition: all 0.2s ease-in-out;
    cursor: auto;

    ${(props) =>
        props.large &&
        `
        overflow-y: scroll;
        width: 840px;
        height: fit-content;
        max-height: 95vh;
        max-width: 95vw;
    `}
`
