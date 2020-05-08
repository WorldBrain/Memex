import styled from 'styled-components'

export const InputTextField = styled.input`
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    border: none;
    outline: none;
    width: 100%;
    padding: 10px 20px;
    margin-left: 0px;
    box-sizing: border-box;
    background-color: #f7f7f7;
    color: rgb(54, 54, 46);
    border-radius: 3px;
    margin-right: 15px;
    margin-bottom: 1em;
    display: ${(props) => (props.type === 'hidden' ? 'none' : 'unset')};
`
