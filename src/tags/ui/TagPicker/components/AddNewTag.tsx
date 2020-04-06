import React from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import { TagResultItem } from './TagResultItem'

interface Props {
    onPress: () => void
    onPressTagAll: () => void
    tag: string
}

export default (props: Props) => {
    return (
        <AddNew onClick={props.onPress}>
            <span>Create new:</span>
            <TagResultItem>{props.tag}</TagResultItem>
            <Flex />
            <IconStyleWrapper show>
                <ButtonTooltip
                    tooltipText="Tag all tabs in window"
                    position="left"
                >
                    <TagAllTabsButton
                        size={20}
                        onClick={props.onPressTagAll}
                    />
                </ButtonTooltip>
            </IconStyleWrapper>
        </AddNew>
    )
}

const Flex = styled.div`
flex:1
`

export const AddNew = styled.div`
    align-items: start;
    display: flex;
    color: ${props => props.theme.text};
    font-size: ${fontSizeSmall}px;
    padding: 4px;
    word-break: break-all;
    span {
        margin-right: 10px;
        min-width: 87px;
        padding-top: 5px;
    }
    cursor: pointer;
`
