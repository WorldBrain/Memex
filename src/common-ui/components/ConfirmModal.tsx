import React, { PureComponent } from 'react'
import cx from 'classnames'

import Modal, { Props as ModalProps } from './Modal'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import styled from 'styled-components'

const styles = require('./ConfirmModal.css')

export interface Props extends ModalProps {
    isShown: boolean
    message?: string
    isLoading?: boolean
    submessage?: string
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
                    {this.props.isLoading && (
                        <div className={styles.loadingSpinnerBox}>
                            <LoadingIndicator />
                        </div>
                    )}
                    {this.props.message && (
                        <MessageContainer>
                            <SectionTitle className={styles.messageBox}>
                                {this.props.message}
                            </SectionTitle>
                            <InfoText>{this.props.submessage}</InfoText>
                        </MessageContainer>
                    )}
                </div>
                <div className={styles.btnBar} tabIndex={0}>
                    {this.props.children}
                </div>
            </Modal>
        )
    }
}
const MessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 18px;
    font-weight: bold;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 30px;
    font-weight: 400;
    text-align: center;
`

export default ConfirmModal
