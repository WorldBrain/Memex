import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import styles from './Modal.css'

class Overlay extends Component {
    static DEF_ROOT_EL = 'div'

    static propTypes = {
        rootEl: PropTypes.string,
        className: PropTypes.string,
        innerClassName: PropTypes.string,
        onClick: PropTypes.func,
        children: PropTypes.oneOfType([
            PropTypes.node,
            PropTypes.arrayOf(PropTypes.node),
        ]).isRequired,
    }

    static defaultProps = {
        rootEl: Overlay.DEF_ROOT_EL,
        className: styles.overlay,
    }

    constructor(props) {
        super(props)

        this.overlayRoot = document.createElement(props.rootEl)
    }

    componentDidMount() {
        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        document.body.removeChild(this.overlayRoot)
    }

    handleClick = event =>
        this.props.onClick ? this.props.onClick(event) : null

    handleInnerClick = event => event.stopPropagation()

    render() {
        const { className, innerClassName, children } = this.props

        return ReactDOM.createPortal(
            <div
                className={className}
                onClick={this.handleClick}
                disabled={this.props.onClick == null}
            >
                <div className={innerClassName} onClick={this.handleInnerClick}>
                    {children}
                </div>
            </div>,
            this.overlayRoot,
        )
    }
}

export default Overlay
