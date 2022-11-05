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
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    text-align: center;
    margin-top: 15px;
`

const Subtitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 14px;
    font-weight: 300;
    display: flex;
    justify-content: center;
    text-align: center;
`
