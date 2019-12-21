import styled from 'styled-components'
import { colorButtonHighlightBackground } from 'src/common-ui/components/design-library/colors'

export const ButtonSideMenu = styled.div`
    text-align: center;
    padding: 1em;
    display: flex;
    cursor: pointer;
    width: 100%;

    :hover {
        background-color: ${colorButtonHighlightBackground};
    }
`
