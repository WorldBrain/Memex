import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Overlay from './Overlay'
import styles from './Modal.css'

class Modal extends PureComponent {
    static propTypes = {
        onClose: PropTypes.func,
        children: Overlay.propTypes.children,
        large: PropTypes.bool,
    }

    render() {
        return (
            <Overlay
                className={styles.overlay}
                innerClassName={
                    this.props.large === true ? styles.popupLarge : styles.popup
                }
                onClose={this.props.onClose}
                onClick={this.props.onClose}
            >
                {this.props.onClose && (
                    <button
                        className={cx(styles.close, styles.button)}
                        onClick={this.props.onClose}
                        data-annotation="sidebar"
                    />
                )}
                <div className={styles.content}>{this.props.children}</div>
            </Overlay>
        )
    }
}

export default Modal
