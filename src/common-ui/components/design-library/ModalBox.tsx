import React from 'react'
import styled from 'styled-components'

const StyledModalBox = styled.div`
    background-color: #ffffff;
`
const HeaderText = styled.h2`
    font-family: Inter;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 24px;
    text-align: center;

    /* Website - Text Colour */
    color: #544960;
`
const Header = styled.div`
    margin: 5px;
`
const CloseButton = styled.div``

const StyledLine = styled.hr``
const Actions = styled.div``
const Body = styled.div`
    display: flex;
    align-content: center;
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
            <CloseButton />
        </Header>
        <StyledLine />
        <Body>{children}</Body>
        <Actions>{actions}</Actions>
    </StyledModalBox>
)

export const ModalColLeft = styled.div`
    flex-grow: 2;
`
export const ModalColRight = styled.div`
    flex-grow: 1;
`
