import styled from 'styled-components'
import { colorButtonHighlightBackground } from 'src/common-ui/components/design-library/colors'

export const ButtonSideMenu = styled.div`
    text-align: center;
    padding: 1em 0;
    display: flex;
    cursor: pointer;
    max-width: 280px;
    min-width: 260px;

    :hover {
        background-color: ${colorButtonHighlightBackground};
    }
`
