import React from 'react'
import styled, { css } from 'styled-components'
import colors from '../../colors'
import styleConstants from '../../styleConstants'

const { fonts } = styleConstants

export const SidebarHeaderContainer = styled.div`
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
`

export const CollectionTitle = styled.p`
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.bold};
    line-height: 21px;
`
