import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import { TagResultItem } from './TagResultItem'
import { X as XIcon } from '@styled-icons/feather/X'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import {
    IconStyleWrapper,
    TagAllTabsButton,
} from 'src/tags/ui/TagPicker/components/TagRow'

interface Props {
    onPress: () => void
    tag: string
    children: ReactNode | ReactNode[]
}

export default (props: Props) => {
    return (
        <AddNew onClick={props.onPress}>
            <span>Create new:</span>
            <TagResultItem>{props.tag}</TagResultItem>
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
