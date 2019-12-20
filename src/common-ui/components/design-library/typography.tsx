import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'

export const fontSizeNormal = 14
export const fontSizeTitle = 16
export const fontSizeBigger = 30

export const TypographyHeadingSmall = styled.span`
    font-size: ${fontSizeNormal}px;
    text-decoration: none;
    margin-right: 5px;
`

export const TypographyLink = styled.span`
    font-size: ${fontSizeNormal}px;
    text-decoration: none;
    margin: 5px;
    color: ${colorPrimary};
    cursor: pointer;
    padding: 5px;
`

export const TypographyHeadingPage = styled.span`
    font-size: ${fontSizeBigger}px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 2em;
`

export const TypographyInputTitle = styled.h2`
    font-family: 'Inter', sans-serif;
    font-size: ${fontSizeTitle}px;
    font-weight: bold;
    box-sizing: border-box;
    margin-bottom: 5px;
    margin-top: 30px;
`
