import React from 'react'
import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import { TagResultItem } from './TagResultItem'

export default props => {
    return (
        <>
            <AddNew>
                <span>Add New tag:</span>
                <TagResultItem>{props.name}</TagResultItem>
            </AddNew>
        </>
    )
}

export const AddNew = styled.div`
    align-items: start;
    display: flex;
    color: ${props => props.theme.text};
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
    padding: 4px;
    word-break: break-all;
    span {
        margin-right: 10px;
        min-width: 87px;
        padding-top: 3px;
    }
`
