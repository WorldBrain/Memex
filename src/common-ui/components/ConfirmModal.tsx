import React, { PureComponent, ReactChild } from 'react'
import cx from 'classnames'

import Modal from './Modal'
import Spinner from './LoadingIndicator'

const styles = require('./ConfirmModal.css')

export interface Props {
    isShown: boolean
    message: string
    isLoading?: boolean
    children?: ReactChild | ReactChild[]
    onClose: () => void
}

class ConfirmModal extends PureComponent<Props> {
    render() {
        if (!this.props.isShown) {
            return null
        }

        return (
            <Modal onClose={this.props.onClose}>
                <div
                    className={cx(styles.textContainer, {
                        [styles.textContainerLoading]: this.props.isLoading,
                    })}
                >
                    {this.props.message}
                    <Spinner />
                </div>
                <div className={styles.btnBar} tabIndex={0}>
                    {this.props.children}
                </div>
            </Modal>
        )
    }
}

export default ConfirmModal
