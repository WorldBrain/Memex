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
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickAway, true)
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickAway, true)
    }

    private handleClickAway = (event) => {
        const domNode = ReactDOM.findDOMNode(this)

        if (!domNode) {
            return
        }

        if (!domNode.contains(event.target)) {
            this.props.onClickAway(event)
        }
    }

    render() {
        return this.props.children
    }
}
