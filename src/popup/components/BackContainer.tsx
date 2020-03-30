import styled from 'styled-components'
import React from 'react'

interface Props {
    children?: any
    onClick: () => void
}

export const BackContainer = (props: Props) => (
    <div>
        {props.children}
        <Container>
            <BackButton onClick={props.onClick}>Back</BackButton>
        </Container>
    </div>
)

const Container = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    grid-template-areas: 'backButton . .';
    padding: 7px 0 10px 0px;
    border-radius: 0 0 3px 3px;
    background: white;
`

const BackButton = styled.button`
    padding: 3px 8px 3px 8px;
    border-radius: 3px;
    background-color: #e8e8e8;
    color: rgb(54, 54, 46);
    font-weight: 500;
    border: none;
    outline: none;
    grid-area: backButton;
    justify-self: center;
    align-self: center;
    font-size: 15px;
    margin-top: 3px;
    cursor: pointer;
`
