import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'

const backgroundHoverSelected = (props) => {
    if (props.selected || props.isFocused) {
        return props.theme.tag.selected
    } else if (!props.selected) {
        if (props.isFocused) {
            return props.theme.tag.selected
        } else {
            return props.theme.tag.tag
        }
    }
}

export const TagResultItem = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 4px;
    color: white;
    padding: 2px 8px;
    margin: 2px 4px 2px 0;
    font-weight: 400;
    font-size: ${fontSizeSmall}px;
    transition: all 0.1s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
`
