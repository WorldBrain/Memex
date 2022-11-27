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
            <Modal {...this.props}>
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
                                    color={'normalText'}
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

const IconContainer = styled.div`
    height: 48px;
    width: 48px;
    border-radius: 8px;
    background: ${(props) => props.theme.colors.darkHover};
    border: 1px solid
        ${(props) =>
            props.type === 'alert'
                ? props.theme.colors.warning
                : props.theme.colors.purple};
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
    color: ${(props) => props.theme.colors.normalText};
    font-size: 20px;
    font-weight: 700;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 16px;
    font-weight: 300;
    text-align: center;
`

const LoadingSpinnerBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`
export default ConfirmModal
