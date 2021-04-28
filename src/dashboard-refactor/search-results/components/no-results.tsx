import React from 'react'
import styled from 'styled-components'

export interface Props {
    title: string
    children?: React.ReactChild
}

export default function NoResults(props: Props) {
    return (
        <div>
            <Title>{props.title}</Title>
            {props.children && <Subtitle>{props.children}</Subtitle>}
        </div>
    )
}

const Title = styled.div`
    color: ${(props) => props.theme.colors.primary};
    font-size: 18px;
    font-weight: 700;
    padding-top: 30px;
    margin-bottom: 20px;
    text-align center;
`

const Subtitle = styled.div`
    color: ${(props) => props.theme.colors.primary};
    font-size: 15px;
    font-weight: 300;
    display: flex;
    justify-content: center;
`
