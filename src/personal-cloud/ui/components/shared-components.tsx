import styled from 'styled-components'

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`

export const BtnBox = styled.div`
    display: flex;
    justify-content: center;
`

export const Header = styled.h1``

export const Text = styled.span<{ dimmed: boolean; clickable: boolean }>``
