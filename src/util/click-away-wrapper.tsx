import React, { MouseEventHandler } from 'react'
import ReactDOM from 'react-dom'

export interface Props {
    onClickAway: MouseEventHandler
}

/**
 * This acts as a bit of a simpler alternative to `react-onclickoutside`.
 * Often we face issues getting that lib to work, or we've used it too many times
 * for related components that it conflicts, so this can be used as an alternative.
 *
 * NOTE: Does NOT work in the Shadow DOM :( as `ReactDOM.findDOMNode` doesn't work there
 */
export class ClickAway extends React.Component<Props> {
    rootNode?: HTMLDocument | ShadowRoot
    thisNode?: HTMLElement

    handleRef = (element: HTMLElement) => {
        this.thisNode = element
        this.rootNode = element?.getRootNode?.() as
            | HTMLDocument
            | ShadowRoot
            | undefined
        this.rootNode?.addEventListener?.('mousedown', this.handleClick, true)
    }

    componentWillUnmount() {
        this.rootNode?.removeEventListener?.(
            'mousedown',
            this.handleClick,
            true,
        )
    }

    private handleClick = (event) => {
        const domNode = this.thisNode
        if (!domNode) {
            return
        }

        // console.log(domNode, event.target)
        if (!domNode.contains(event.target)) {
            this.props.onClickAway?.(event)
        }
    }

    render() {
        return <div ref={this.handleRef}>{this.props.children}</div>
    }
}
