import React from 'react'
import styled from 'styled-components'

export const DRAG_EL_ID = 'dragged-element'

export default () => (
    <DragElement id={DRAG_EL_ID}> Drop into Collection</DragElement>
)

const DragElement = styled.div<{ id: 'dragged-element' }>`
    text-decoration: none;
    display: none;
    border: solid 2px ${(props) => props.theme.colors.purple};
    border-radius: 4px;
    font-size: 0.8rem;
    max-height: 50px;
    max-width: 330px;
    text-align: center;
    font-weight: 500;
    background: #fff;
    color: ${(props) => props.theme.colors.purple};
    top: -90vh;
    opacity: 1;
    padding: 5px 10px;
    position: absolute;
    margin-left: 25px;
`
