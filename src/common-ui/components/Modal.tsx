import React, { PureComponent, MouseEventHandler } from 'react'
import styled from 'styled-components'

import Overlay, { Props as OverlayProps } from './Overlay'
import { close as closeIcon } from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

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
                    <CloseContainer>
                        <Icon
                            filePath={icons.close}
                            heightAndWidth="16px"
                            onClick={onClose}
                        />
                    </CloseContainer>
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

export const CloseContainer = styled.div`
    position: absolute;
    top: 15px;
    right: 15px;
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
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
