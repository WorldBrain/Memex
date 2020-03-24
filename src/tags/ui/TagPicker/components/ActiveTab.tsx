import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

export const ActiveTab = styled.div`
    align-items: center;
    background: ${props => props.theme.tag.selected};
    border: 2px solid ${props => props.theme.tag.tag};
    border-radius: 5px;
    color: ${props => props.theme.tag.text};
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
    padding: 0 4px 0 8px;
    margin: 2px 4px 2px 0;
    transition: background 0.3s;

    &:hover {
        cursor: pointer;
    }
`
