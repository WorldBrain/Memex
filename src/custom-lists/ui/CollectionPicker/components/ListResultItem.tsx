import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'

const backgroundHoverSelected = (props) => {
    if (props.selected || props.isFocused) {
        return props.theme.tag.selected
    } else if (!props.selected) {
        if (props.isFocused) {
            return props.theme.tag.selected
        } else {
            return props.theme.tag.list
        }
    }
}

export const ListResultItem = styled.div`
    display: block;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.normalText};
    padding: 0 0px 0 0;
    margin: 2px 4px 2px 0;
    font-weight: 400;
    font-size: 14px;
    transition: all 0.1s;
    word-break: break-word;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    max-width: 90%;

    &:hover {
        cursor: pointer;
    }
`
