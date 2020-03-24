import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'

export const TagResultItem = styled.div`
    display: flex;
    min-height: 16px;
    border: 2px solid;
    background: ${props =>
        props.isHovering ? props.theme.tag.selected : props.theme.tag.tag}
    border-color: ${props =>
        props.isHovering ? props.theme.tag.tag : 'transparent'};
    border-radius: 5px;
    color: ${props => props.theme.tag.text};
    padding: 0 8px;
    margin: 2px 4px 2px 0;
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
    transition: all .3s;

    &:hover {
      background: ${props => props.theme.tag.selected};
      border-color: ${props => props.theme.tag.tag};
      cursor: pointer;
    }
`
