import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Overlay from './Overlay'
import styles from './Modal.css'

class Modal extends PureComponent {
    static propTypes = {
        onClose: PropTypes.func,
        children: Overlay.propTypes.children,
    }

    render() {
        return (
            <Overlay
                className={styles.overlay}
                innerClassName={styles.popup}
                onClose={this.props.onClose}
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
            </Overlay>
        )
    }
}

export default Modal
