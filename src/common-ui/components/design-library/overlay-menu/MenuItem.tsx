import styled from 'styled-components'
import { colorButtonHighlightBackground } from 'src/common-ui/components/design-library/colors'
// tslint:disable-next-line:variable-name
export const MenuItem = styled.div`
    height: 40px;
    width: 130px;
    background: white;
    padding: 1em;
    text-align: center;
    align-self: center;
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    display: flex;
    align-items: center;

    :hover {
        background: ${colorButtonHighlightBackground};
    }
`
