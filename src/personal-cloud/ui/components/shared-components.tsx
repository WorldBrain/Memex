import styled from 'styled-components'

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 800px;
    height: 400px;
    align-items: center;
    border-radius: 12px;
`

export const BtnBox = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-column-gap: 10px;
`

export const Header = styled.div`
    font-size: 20px;
    color: ${(props) => props.theme.colors.primary};
    font-weight: bold;
    text-align: center;
    margin-bottom: 15px;
`

export const TopComponent = styled.div`
    margin-bottom: 20px;
`

export const Text = styled.span<{
    dimmed: boolean
    clickable: boolean
    bold: boolean
}>`
    color: ${(props) =>
        props.dimmed ? props.theme.colors.subText : props.theme.colors.primary};
    margin-bottom: ${(props) => (props.dimmed ? '0px' : '40px')};
    margin-top: ${(props) => props.dimmed && '20px'};
    font-size: ${(props) => !props.dimmed && '14px'};
    font-weight: ${(props) => (props.bold ? 'bold' : 'normal')};
    cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
    text-align: center;
`
