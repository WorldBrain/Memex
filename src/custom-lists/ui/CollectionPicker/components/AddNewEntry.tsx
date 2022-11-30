import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
interface Props {
    onPress: () => void
    children?: ReactNode | ReactNode[]
    resultItem: ReactNode
}

export default (props: Props) => {
    return (
        <AddNew onClick={props.onPress}>
            <ContentBox>
                <Icon
                    icon={icons.plus}
                    color={'backgroundColor'}
                    heightAndWidth={'18px'}
                    hoverOff
                />
                <Title>Create "{props.resultItem}"</Title>
            </ContentBox>
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
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.colors.backgroundColor};
    background: ${(props) => props.theme.colors.normalText};
    font-size: ${fontSizeSmall}px;
    font-weight: 500;
    min-height: 20px;
    height: fit-content;
    padding: 8px 20px;
    word-break: break-word;
    cursor: pointer;
    border-radius: 5px;
    margin: 10px;

    & * {
        cursor: pointer;
    }
`

const ContentBox = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 10px;
    font-size: 14px;
    align-items: center;
    color: ${(props) => props.theme.colors.normalText};
`

const Title = styled.span`
    color: ${(props) => props.theme.colors.backgroundColor};
    font-size: 14px;
    display: flex;
`
