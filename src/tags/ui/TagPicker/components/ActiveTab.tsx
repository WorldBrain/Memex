import styled from 'styled-components'
import { fontSizeSmall } from 'src/common-ui/components/design-library/typography'

export const ActiveTab = styled.div`
    background: ${props => props.theme.tag.selected};
    border: 2px solid ${props => props.theme.tag.border};
    border-radius: 5px;
    color: ${props => props.theme.tag.text};
    padding: 2px 8px;
    margin: 2px 4px 2px 0;
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeSmall}px;
`
