import React, { PureComponent } from 'react'
import cx from 'classnames'

import Modal, { Props as ModalProps } from './Modal'
import Spinner from './LoadingIndicator'

const styles = require('./ConfirmModal.css')

export interface Props extends ModalProps {
    isShown: boolean
    message: string
    isLoading?: boolean
}

class ConfirmModal extends PureComponent<Props> {
    render() {
        if (!this.props.isShown) {
            return null
        }

        return (
            <Modal {...this.props}>
                <div
                    className={cx(styles.textContainer, {
                        [styles.textContainerLoading]: this.props.isLoading,
                    })}
                >
                    {this.props.isLoading && <div className={styles.loadingSpinnerBox}><Spinner /></div>}
                    <div className={styles.messageBox}>{this.props.message}</div>
                </div>
                <div className={styles.btnBar} tabIndex={0}>
                    {this.props.children}
                </div>
            </Modal>
        )
    }
}

export default ConfirmModal
