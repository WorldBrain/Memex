import React from 'react'
import styled from 'styled-components'

export interface Props {
    onCancelBtnClick: React.MouseEventHandler
    onInfoBtnClick: React.MouseEventHandler
}

export default class DeprecatedSearchWarning extends React.Component<Props> {
    render() {
        return (
            <Container>
                <TextContainer>
                    <TitleText>
                        We deprecated the Full-Text History Search.
                    </TitleText>
                    <ContentText>
                        You can still full-text search all pages you organized,
                        annotated, or shared. We're sorry for everyone who loved
                        it and really hope it will come back later.
                    </ContentText>
                </TextContainer>
                <BtnContainer>
                    <InfoBtn onClick={this.props.onInfoBtnClick}>
                        Why?!?
                    </InfoBtn>
                    <CancelBtn onClick={this.props.onCancelBtnClick} />
                </BtnContainer>
            </Container>
        )
    }
}

const Container = styled.div``
const TextContainer = styled.div``
const BtnContainer = styled.div``
const TitleText = styled.h1``
const ContentText = styled.p``
const InfoBtn = styled.button``
const CancelBtn = styled.button``
