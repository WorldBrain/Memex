import React, { PureComponent } from 'react'
import cx from 'classnames'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

import Modal, { Props as ModalProps } from './Modal'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import styled from 'styled-components'

export interface Props extends ModalProps {
    isShown: boolean
    message?: string
    isLoading?: boolean
    submessage?: string
    type?: string
    icon?: string
}

class ConfirmModal extends PureComponent<Props> {
    render() {
        if (!this.props.isShown) {
            return null
        }

        return (
            <Modal onClose={this.props.onClose} {...this.props}>
                {this.props.isLoading ? (
                    <LoadingSpinnerBox>
                        <LoadingIndicator />
                    </LoadingSpinnerBox>
                ) : (
                    <ContentBox>
                        {this.props.icon && (
                            <IconContainer type={this.props.type}>
                                <Icon
                                    filePath={this.props.icon}
                                    heightAndWidth={'24px'}
                                    color={'white'}
                                    hoverOff
                                />
                            </IconContainer>
                        )}
                        <TextContainer>
                            {this.props.message && (
                                <MessageContainer>
                                    <SectionTitle>
                                        {this.props.message}
                                    </SectionTitle>
                                    {this.props.submessage && (
                                        <InfoText>
                                            {this.props.submessage}
                                        </InfoText>
                                    )}
                                </MessageContainer>
                            )}
                        </TextContainer>
                        <ButtonBar>{this.props.children}</ButtonBar>
                    </ContentBox>
                )}
            </Modal>
        )
    }
}

const IconContainer = styled.div<{
    type: string
}>`
    height: 48px;
    width: 48px;
    border-radius: 8px;
    background: ${(props) => props.theme.colors.greyScale2};
    border: 1px solid
        ${(props) =>
            props.type === 'alert'
                ? props.theme.colors.warning
                : props.theme.colors.prime1};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
`

const ContentBox = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`

const TextContainer = styled.div`
    display: flex;
    align-items: center;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 30px;
`

const ButtonBar = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: row-reverse;
    outline: none;
`

const MessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
`

const SectionTitle = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    font-size: 30px;
    font-weight: 800;
    margin-bottom: 10px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: left;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 18px;
    font-weight: 300;
    text-align: center;
    margin-bottom: 20px;
`

const LoadingSpinnerBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`
export default ConfirmModal
