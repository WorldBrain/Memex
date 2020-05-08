import styled from 'styled-components'
import {
    colorPrimary,
    colorText,
} from 'src/common-ui/components/design-library/colors'

export const fontSizeSmallest = 12
export const fontSizeSmall = 13
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
    font-size: ${fontSizeTitle}px;
    font-weight: 600;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: #544960;
`

export const TypographyInputTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: ${fontSizeTitle}px;
    font-weight: bold;
    box-sizing: border-box;
    margin-bottom: 5px;
    margin-top: 10px;
`

export const TypographyButtonLabel = styled.span`
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
    font-size: ${fontSizeSmall}px;
    line-height: 1.4;
    text-align: center;
    color: #fafafb;
`
export const TypographyActionText = styled.span`
    line-height: 1.4;
    text-align: center;
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
`

export const TypographyBody = styled.span`
    font-style: normal;
    font-weight: 300;
    font-size: 16px;
    line-height: 1.4;
    margin-top: 20px;
    text-align: left;
    color: ${colorText};
`

export const CenterText = styled.div`
    text-align: center;
`

export const TypographyBodyBlock = styled(TypographyBody)`
    display: block;
    font-style: normal;
    font-weight: 300;
    font-size: 16px;
    line-height: 1.4;
    color: #544960;
`

export const TypographyBodyBold = styled.div`
    display: block;
    font-weight: bold;
    margin: 10px 0;
    font-size: 16px;
    color: #544960;
    text-align: center;
`

export const TypographyBodyCenter = styled.div`
    display: block;
    font-size: 16px;
    text-align: center;
    color: #544960;
`
export const HelpBlock = styled.div`
    display: block;
    font-size: ${fontSizeSmall};
    text-align: center;
    margin-top: 0px;
    color: #544960;
`

export const StageBlock = styled.div`
    display: block;
    font-weight: bold;
    font-size: 16px;
    color: #544960;
    text-align: center;
    margin-bottom: 30px;
    margin-top: 5px;
`

export const ProgressBox = styled.div`
    width: 100%;
`

export const Warning = styled.p`
    color: red;
    font-weight: 700;
    font-size: 18px;
`

export const WhiteSpacer10 = styled.div`
    margin-top: 10px;
`

export const WhiteSpacer20 = styled.div`
    margin-top: 20px;
`

export const WhiteSpacer30 = styled.div`
    margin-top: 30px;
`

export const HoverColor = styled.div`
    background-color: #dadada
`
