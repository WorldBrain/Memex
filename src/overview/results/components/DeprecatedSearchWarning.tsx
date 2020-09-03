import React from 'react'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'


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
                        annotated, or shared. <br/>We're sorry for everyone who loved
                        it and really hope it will come back later.
                    </ContentText>
                </TextContainer>
                <BtnContainer>
                    <InfoBtn onClick={this.props.onInfoBtnClick}>
                        Why?!?
                    </InfoBtn>
                    <CancelBtn src={icons.close} onClick={this.props.onCancelBtnClick} />
                </BtnContainer>
            </Container>
        )
    }
}

const Container = styled.div`
    position: absolute;
    z-index: 2500;
    background: #f29d9d;
    top: 70px;
    border-radius: 5px;
    padding: 10px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    max-width: 800px;
`

const TextContainer = styled.div`
    width: 80%    
`
const BtnContainer = styled.div`
    width: 20%
    flex: 1;
    justify-content: flex-end;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 15px;
    align-items: center;
`
const TitleText = styled.h1``
const ContentText = styled.p`
    font-size: 14px;
`
const InfoBtn = styled.button`
    background: white;
    border-radius: 3px;
    color: #3a2f45;
    padding: 8px 16px;
    font-weight: bold;
    font-size: 14px;
    border: none;
    cursor: pointer;
    outline: none;
`

const CancelBtn = styled.img`
    padding: 4px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: #e0e0e0
        border-radius: 3px;
    }
`
