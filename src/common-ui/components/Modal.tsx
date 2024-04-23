import React, {
    PureComponent,
    MouseEventHandler,
    KeyboardEventHandler,
} from 'react'
import styled from 'styled-components'

import Overlay, { Props as OverlayProps } from './Overlay'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Omit<OverlayProps, 'onClick'> {
    ignoreClickOutside?: boolean
    onClose?: any
    rootEl?: string
}

class Modal extends PureComponent<Props> {
    render() {
        const { onClose, ignoreClickOutside, ...props } = this.props
        return (
            <Container onClick={onClose} {...props}>
                {onClose && (
                    <CloseContainer>
                        <Icon
                            filePath={icons.removeX}
                            heightAndWidth="22px"
                            onClick={onClose}
                        />
                    </CloseContainer>
                )}
                <Content>{this.props.children}</Content>
            </Container>
        )
    }
}

export default Modal

const Container = styled.div`
    border-radius: 10px;
    background: ${(props) => props.theme.colors.greyScale1};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    padding: 20px;
    min-width: 500px;
    min-height: 200px;
`

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
