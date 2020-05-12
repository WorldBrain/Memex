import React, { PureComponent, MouseEventHandler } from 'react'
import styled from 'styled-components'
import cx from 'classnames'

import Overlay from './Overlay'

const styles = require('./Modal.css')

export interface Props {
    onClose?: MouseEventHandler
    large?: boolean
}

class Modal extends PureComponent<Props> {
    static propTypes = {}

    render() {
        return (
            <Overlay
                innerClassName={cx({
                    [styles.popup]: !this.props.large,
                    [styles.popupLarge]: this.props.large,
                })}
                onClick={this.props.onClose}
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
    top: 5px;
    right: 5px;
    background-size: 12px;
    width: 100px;
    height: 22px;
    border: none;
    transition: all 200ms;
    cursor: pointer;
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
