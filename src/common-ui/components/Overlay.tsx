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
    /**
     * Skips rendering the Overlay within a React portal
     * NOTE: If using from the in-page shadowDOM UIs, set this flag - else funky stuff happens to styles in prod builds!
     */
    ignoreReactPortal?: boolean
    /** If set, renders a wrapping `StyleSheetManager` component. */
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

        if (props.ignoreReactPortal) {
            return
        }

        this.overlayRoot = document.createElement(props.rootEl)
        this.overlayRoot.classList.add(props.ignoreClickOutsideClassName)
    }

    componentDidMount() {
        if (this.props.ignoreReactPortal) {
            return
        }

        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        if (this.props.ignoreReactPortal) {
            return
        }

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
        if (this.props.ignoreReactPortal) {
            return this.renderMain()
        }

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
    z-index: 2147483647;
    background: rgba(18, 19, 27, 0.6);
    backdrop-filter: blur(15px);
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    justify-content: center;
    align-items: center;
`

export const InnerDiv = styled.div<{ large: boolean }>`
    /* elements.css .toolTips */
    border-radius: 3px;
    overflow: hidden;
    overflow-y: scroll;
    background: ${(props) => props.theme.colors.greyScale1};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    min-width: 500px;
    min-height: 200px;
    border-radius: 12px;
    padding: 20px;
    position: relative;
    transition: all 0.2s ease-in-out;
    cursor: auto;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    ${(props) =>
        props.large &&
        `
        overflow-y: scroll;
        height: fit-content;
        max-height: 95vh;
        max-width: 95vw;
        width: fit-content;
    `}
`
