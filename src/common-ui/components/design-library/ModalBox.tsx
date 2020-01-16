import React from 'react'
import styled from 'styled-components'

const StyledModalBox = styled.div`
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 100%;
`
const HeaderText = styled.h2`
    font-family: Inter;
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    margin: 30px 0;
    text-align: center;

    /* Website - Text Colour */
    color: #544960;
`
const Header = styled.div`
    color: #544960;
    font-weight: 600;
    flex: 1;
`
const StyledLine = styled.div`
    border: 0.5px solid #E0E0E0;
`
const Actions = styled.div`
    display: flex;
    justify-content: center;
    padding: 20px;
`
const Body = styled.div`
    display: flex;
    align-content: center;
    padding: 40px 50px;
    flex: 5;
`
export const ModalBox = ({
    header,
    actions,
    children,
}: {
    header: any
    actions: any
    children: any
}) => (
    <StyledModalBox>
        <Header>
            <HeaderText>{header}</HeaderText>
        <StyledLine />
        </Header>
        <Body>{children}</Body>
        <Actions>{actions}</Actions>
    </StyledModalBox>
)

export const ModalColLeft = styled.div`
    width: 60%;
    padding-right: 50px;
`
export const ModalColRight = styled.div`
    width: 40%;
    display: flex;
    align-items: center;
    justify-content: center;

    & img {
        width: 100%;
    }
`

export const ModalColRightBig = styled(ModalColRight)`
    & img {
        width: 100%;
        margin-right: -100px;
        margin-top: -10px;
        margin-bottom: -60px;
    }
`
