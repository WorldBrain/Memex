import React from 'react'
import styled from 'styled-components'

export interface Props {
    title: any
    children?: any
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
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    text-align center;
`

const Subtitle = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    font-weight: 300;
    display: flex;
    justify-content: center;
    text-align: center;
`
