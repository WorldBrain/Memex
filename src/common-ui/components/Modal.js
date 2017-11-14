import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Modal.css'

class Modal extends Component {
    static propTypes = {
        onClose: PropTypes.func,
        children: PropTypes.oneOfType([
            PropTypes.node,
            PropTypes.arrayOf(PropTypes.node),
        ]).isRequired,
    }

    constructor(props) {
        super(props)

        this.modalRoot = document.createElement('div')
    }

    componentDidMount() {
        document.body.appendChild(this.modalRoot)
    }

    componentWillUnmount() {
        document.body.removeChild(this.modalRoot)
    }

    render() {
        return ReactDOM.createPortal(
            <div
                className={styles.overlay}
                disabled={this.props.onClose == null}
                onClick={this.props.onClose}
            >
                <div
                    className={styles.popup}
                    onClick={event => event.stopPropagation()}
                >
                    {this.props.onClose && (
                        <button
                            className={cx(styles.close, styles.button)}
                            onClick={this.props.onClose}
                        >
                            ×
                        </button>
                    )}
                    <div className={styles.content}>{this.props.children}</div>
                </div>
            </div>,
            this.modalRoot,
        )
    }
}

export default Modal
