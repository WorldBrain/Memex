import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    onPress: () => void
    children: ReactNode | ReactNode[]
    resultItem: ReactNode
}

export default (props: Props) => {
    return (
        <AddNew onClick={props.onPress}>
            <ContentBox>
                <Title>Create (Enter)</Title>
                {props.resultItem}
            </ContentBox>
            <Flex />
            {props.children}
        </AddNew>
    )
}

const Flex = styled.div`
    flex: 1;
`

export const AddNew = styled.div`
    align-items: start;
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.text};
    font-size: ${fontSizeSmall}px;
    font-weight: 700;
    height: 50px;
    padding: 0 20px;
    word-break: break-word;
    cursor: pointer;
`

const ContentBox = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 10px;
    fonts-size: 14px;
    align-items: center;
    color: ${(props) => props.theme.colors.normalText};
`

const Title = styled.span`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
`
