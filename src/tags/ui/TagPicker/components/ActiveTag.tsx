import styled from 'styled-components'
import { fontSizeSmallest } from 'src/common-ui/components/design-library/typography'

export const ActiveTag = styled.div`
    align-items: center;
    background: ${props => props.theme.tag.selected};
    border: 2px solid ${props => props.theme.tag.tag};
    border-radius: 4px;
    color: ${props => props.theme.tag.text};
    font-size: ${fontSizeSmallest}px;
    font-weight: 400;
    padding: 0 4px 0 8px;
    margin: 2px 4px 2px 0;
    transition: background 0.3s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
`
