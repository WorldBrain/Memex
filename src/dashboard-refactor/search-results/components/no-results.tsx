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
    color: #3a2f45;
    font-size: 18px;
    font-weight: 700;
    padding-top: 30px;
    margin-bottom: 20px;
`

const Subtitle = styled.div`
    color: #3a2f45;
    font-size: 15px;
    font-weight: 300;
    display: flex;
    justify-content: center;
`
