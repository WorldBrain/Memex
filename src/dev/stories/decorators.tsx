import styled from 'styled-components'
import React from 'react'

const GlobalStyles = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
`
export const withGlobalStyles = (storyFn) => (
    <GlobalStyles>{storyFn()}</GlobalStyles>
)
