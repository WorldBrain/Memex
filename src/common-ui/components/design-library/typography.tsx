import styled from 'styled-components'
import { colorPrimary } from 'src/common-ui/components/design-library/colors'

export const fontSizeNormal = 14
export const fontSizeBig = 17
export const fontSizeTitle = 16
export const fontSizeBigger = 30

export const TypographyHeadingSmall = styled.span`
    font-size: ${fontSizeNormal}px;
    text-decoration: none;
    margin-right: 5px;
`

export const TypographyHeadingBig = styled.span`
    font-size: ${fontSizeBig}px;
    text-decoration: none;
    margin-right: 5px;
    font-weight: bold;
    text-align: center;
    width: 100%;
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
    margin-bottom: 0.5em;
`

export const TypographyInputTitle = styled.h2`
    font-family: 'Inter', sans-serif;
    font-size: ${fontSizeTitle}px;
    font-weight: bold;
    box-sizing: border-box;
    margin-bottom: 5px;
    margin-top: 10px;
`
