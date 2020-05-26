import React, { PureComponent, MouseEventHandler } from 'react'
import styled from 'styled-components'
import cx from 'classnames'

import Overlay, { Props as OverlayProps } from './Overlay'

const styles = require('./Modal.css')

export interface Props extends Omit<OverlayProps, 'onClick'> {
    onClose?: MouseEventHandler
    large?: boolean
}

class Modal extends PureComponent<Props> {
    static propTypes = {}

    render() {
        const { onClose, large, ...props } = this.props

        return (
            <Overlay
                innerClassName={cx({
                    [styles.popup]: !large,
                    [styles.popupLarge]: large,
                })}
                onClick={onClose}
                {...props}
            >
                {this.props.onClose && (
                    <CloseButton
                        onClick={this.props.onClose}
                        data-annotation="sidebar"
                    />
                )}
                <Content>{this.props.children}</Content>
            </Overlay>
        )
    }
}

export default Modal

export const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background-size: 14px;
    width: 22px;
    height: 22px;
    border: none;
    transition: all 200ms;
    cursor: pointer;
    background-color: transparent;
    background-image: url('/img/close.svg');
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 3px;
`

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 13.5px;
    min-height: 100%;
    height: 100%;
    align-items: center;
    padding: 50px;
`
