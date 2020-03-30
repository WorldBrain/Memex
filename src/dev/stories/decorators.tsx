import styled from 'styled-components'
import React from 'react'

const GlobalStyles = styled.div`
    font-family: 'Poppins', sans-serif;
`
export const withGlobalStyles = storyFn => (
    <GlobalStyles>{storyFn()}</GlobalStyles>
)
