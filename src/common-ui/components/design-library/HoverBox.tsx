import styled from 'styled-components'

export const HoverBox = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: hidden;

    margin-top: 30px;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    margin-left: 115px;
    border-radius: 3px;
`

export const HoverBoxDashboard = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: hidden;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    border-radius: 3px;
    margin-left: ${(props) => (props.marginLeftOffset ?? 0) + 500}px;
    margin-top: 45px;
`
