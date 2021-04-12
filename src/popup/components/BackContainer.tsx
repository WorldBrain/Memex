import styled from 'styled-components'
import React from 'react'
import {
    colorGrey3,
    colorGrey4,
    colorGrey9,
} from 'src/common-ui/components/design-library/colors'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

interface Props {
    children?: any
    onClick: () => void
}

export const BackContainer = (props: Props) => (
    <div>
        {props.children}
        <Container>
            <BackButton onClick={props.onClick}>Back</BackButton>
            <AutoSaveNote>Autosaved</AutoSaveNote>
        </Container>
    </div>
)

const Container = styled.div`
    margin: 8px 8px 0px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const AutoSaveNote = styled.div`
    font-weight: bold;
    font-size: 12px;
`

const BackButton = styled.button`
    padding: 3px 8px 3px 8px;
    border: 0;
    border-radius: 3px;
    background: ${colorGrey3};
    color: ${colorGrey9};
    font-size: ${fontSizeSmall}px;
    cursor: pointer;

    &:hover {
        background: ${colorGrey4};
    }
`
