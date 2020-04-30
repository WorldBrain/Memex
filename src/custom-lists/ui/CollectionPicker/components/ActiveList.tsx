import styled from 'styled-components'
import { fontSizeSmall, HoverColor } from 'src/common-ui/components/design-library/typography'

export const ActiveList = styled.div`
    align-items: center;
    border-radius: 4px;
    color: ${(props) => props.theme.tag.text};
    font-size: ${fontSizeSmall}px;
    font-weight: 400;
    padding: 0 4px 0 8px;
    margin: 2px 4px 2px 0;
    transition: background 0.3s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
        background-color: #dadada;
    }
`
