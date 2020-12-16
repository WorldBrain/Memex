import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'

export const DomainResultItem = styled.div`
    display: flex;
    border-radius: 4px;
    color: ${(props) => props.theme.tag.text};
    padding: 0 8px;
    margin: 2px 4px 2px 0;
    font-weight: 400;
    font-size: ${fontSizeSmall}px;
    transition: all 0.1s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
`
