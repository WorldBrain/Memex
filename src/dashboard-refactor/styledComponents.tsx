import React from 'react'
import styled, { css } from 'styled-components'

export const Icon = styled.div`
    height: 12px;
    width: 12px;
    font-size: 12px;
    ${(props) =>
        css`
            ${props.iconPath && `background-image: url(${props.iconPath})`};
        `}
`
