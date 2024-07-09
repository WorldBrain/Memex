import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import { UnifiedList } from 'src/annotations/cache/types'
interface Props {
    onPress: () => void
    children?: ReactNode | ReactNode[]
    resultItem: {
        unifiedId: UnifiedList['unifiedId']
        name: UnifiedList['name']
    }[]
    resultsCount: number
    commandKey: string
    getRootElement: () => HTMLElement
}

export default (props: Props) => {
    const newSpacesString = props.resultItem.map((item, i) => {
        if (i === props.resultItem.length - 1) {
            return item.name
        }

        if (props.resultItem.length > 1) {
            return item.name + '/'
        }

        return item.name
    })

    return (
        <AddNew onClick={props.onPress}>
            <ContentBox>
                <Title>Create "{newSpacesString}"</Title>
                {props.resultsCount === 0 && (
                    <KeyboardShortcuts
                        getRootElement={props.getRootElement}
                        size={'small'}
                        keys={['Enter']}
                    />
                )}
                {props.resultsCount > 0 && (
                    <KeyboardShortcuts
                        size={'small'}
                        keys={[props.commandKey, 'Enter']}
                        getRootElement={props.getRootElement}
                    />
                )}
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
    color: ${(props) => props.theme.colors.black};
    background: ${(props) => props.theme.colors.white};
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
    color: ${(props) => props.theme.colors.white};
`

const Title = styled.span`
    color: ${(props) => props.theme.colors.black};
    font-size: 14px;
    display: flex;
    flex: 1;
`
