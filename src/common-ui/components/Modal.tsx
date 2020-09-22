import React, { PureComponent, MouseEventHandler } from 'react'
import styled from 'styled-components'

import Overlay, { Props as OverlayProps } from './Overlay'
import { close as closeIcon } from 'src/common-ui/components/design-library/icons'

export interface Props extends Omit<OverlayProps, 'onClick'> {
    ignoreClickOutside?: boolean
    onClose?: MouseEventHandler
}

class Modal extends PureComponent<Props> {
    render() {
        const { onClose, ignoreClickOutside, ...props } = this.props

        return (
            <Overlay
                onClick={ignoreClickOutside ? undefined : onClose}
                {...props}
            >
                {onClose && (
                    <CloseButton onClick={onClose} data-annotation="sidebar">
                        <CloseButtonImg src={closeIcon} />
                    </CloseButton>
                )}
                <Content>{this.props.children}</Content>
            </Overlay>
        )
    }
}

export default Modal

export const CloseButtonImg = styled.img`
    height: 100%;
    width: 100%;
`

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
    border-radius: 3px;

    &:hover {
        opacity: 0.4;
    }
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
