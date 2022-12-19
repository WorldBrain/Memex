import React from 'react'
import styled from 'styled-components'

export const DRAG_EL_ID = 'dragged-element'

export interface Props {
    isHoveringOverListItem: boolean
}

export default (props: Props) => {
    return (
        <DragElement
            id={DRAG_EL_ID}
            isHoveringOverListItem={props.isHoveringOverListItem}
        >
            {' '}
            Drop into Space
        </DragElement>
    )
}

const DragElement = styled.div<{ id: 'dragged-element' } & Props>`
    text-decoration: none;
    display: none;
    border: ${(props) =>
        props.isHoveringOverListItem
            ? 'none'
            : `solid 2px ${props.theme.colors.purple}`};
    border-radius: 4px;
    font-size: 0.8rem;
    max-height: 50px;
    max-width: 330px;
    text-align: center;
    font-weight: 300;
    color: ${(props) => props.theme.colors.normalText};
    top: -90vh;
    opacity: ${(props) => (props.isHoveringOverListItem ? 0 : 1)};
    visibility: ${(props) => (props.isHoveringOverListItem ? 0 : 1)};
    border-radius: 4px;
    padding: 5px 10px;
    position: absolute;
    margin-left: 25px;
    background: ${(props) => props.theme.colors.backgroundColor}70;
    z-index: 2147483647;
    border: 1px solid ${(props) => props.theme.colors.purple};
    backdrop-filter: blur(4px);
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.6);
`
