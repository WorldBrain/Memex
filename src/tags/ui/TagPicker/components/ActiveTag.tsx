import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

export const ActiveTag = styled.div`
    align-items: center;
    background: ${(props) => props.theme.colors.purple};
    border-radius: 4px;
    color: white;
    font-size: ${fontSizeSmall}px;
    font-weight: 400;
    margin: 2px 4px 2px 0;
    transition: background 0.3s;
    word-break: break-word;
    padding: 3px 8px;

    &:hover {
        cursor: pointer;
    }
`
