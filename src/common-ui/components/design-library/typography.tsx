import styled from 'styled-components'
import {
    colorPrimary,
    colorText,
    colorGrey8,
    colorGrey7,
} from 'src/common-ui/components/design-library/colors'

export const fontSizeSmallest = 10
export const fontSizeSmall = 12
export const fontSizeNormal = 14
export const fontSizeBig = 16
export const fontSizeBigger = 18
export const fontSizeTitle = 20
export const fontSizeBiggerTitle = 22

export const TypographyBigTitle = styled.span`
    font-size: ${fontSizeTitle}px;

    @media (max-width: 1300px) {
        font-size: ${fontSizeBigger}px;
    }
`
export const TypographyHeadingBigger = styled.span`
    font-size: ${fontSizeBigger}px;
    text-decoration: none;
    color: ${colorText};
    margin-right: 5px;
    font-weight: bold;
    width: 100%;
    font-family: 'Poppins', sans-serif;
`

export const TypographyHeadingBig = styled.span`
    font-size: ${fontSizeBig}px;
    text-decoration: none;
    color: ${colorText};
    margin-right: 5px;
    font-weight: bold;
    text-align: center;
    width: 100%;
    font-family: 'Poppins', sans-serif;
`

export const TypographyHeadingNormal = styled.span`
    font-size: ${fontSizeNormal}px;
    text-decoration: none;
    font-weight: bold;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;
`

export const TypographyHeadingSmall = styled.span`
    font-size: ${fontSizeSmall}px;
    text-decoration: none;
    margin-right: 5px;
    font-weight: bold;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;
`

export const TypographyLink = styled.span`
    text-decoration: none;
    font-size: 1em;
    margin: 5px;
    color: ${colorPrimary};
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
`

export const TypographyHeadingPage = styled.span`
    font-size: ${fontSizeBig}px;
    font-weight: 600;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;

    @media (max-width: 1300px) {
        font-size: ${fontSizeNormal}px;
    }
`

export const TypographySubHeading = styled.span`
    font-size: ${fontSizeNormal}px;
    font-weight: 600;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;

    @media (max-width: 1300px) {
        font-size: ${fontSizeSmall}px;
    }
`

export const TypographyTextNormal = styled.span`
    font-size: ${fontSizeNormal}px;
    font-weight: 400;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;

    @media (max-width: 1300px) {
        font-size: ${fontSizeSmall}px;
    }
`

export const TypographySubTextNormal = styled.span`
    font-size: ${fontSizeNormal}px;
    font-weight: 400;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: ${colorGrey7};
    font-family: 'Poppins', sans-serif;

    @media (max-width: 1300px) {
        font-size: ${fontSizeSmall}px;
    }
`

export const TypographyTextSmall = styled.span`
    font-size: ${fontSizeSmall}px;
    font-weight: 400;
    font-family: Poppins;
    font-style: normal;
    line-height: 1.4;
    text-align: left;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;

    @media (max-width: 1300px) {
        font-size: ${fontSizeSmallest}px;
    }
`

export const TypographyInputTitle = styled.h2`
    font-size: ${fontSizeBig}px;
    font-weight: bold;
    box-sizing: border-box;
    margin-bottom: 5px;
    margin-top: 10px;
    font-family: 'Poppins', sans-serif;
`

export const TypographyButtonLabel = styled.span`
    font-style: normal;
    font-weight: 600;
    font-size: ${fontSizeSmall}px;
    line-height: 1.4;
    text-align: center;
    color: #fafafb;
    font-family: 'Poppins', sans-serif;
`
export const TypographyActionText = styled.span`
    line-height: 1.4;
    text-align: center;
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
    font-size: 1em;
    font-family: 'Poppins', sans-serif;
`

export const TypographyBody = styled.span`
    font-style: normal;
    font-weight: 300;
    font-size: 16px;
    line-height: 1.4;
    margin-top: 20px;
    text-align: left;
    color: ${colorText};
    font-family: 'Poppins', sans-serif;
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
    font-family: 'Poppins', sans-serif;
`

export const TypographyBodyCenter = styled.div`
    display: block;
    font-size: 16px;
    text-align: center;
    color: #544960;
    font-family: 'Poppins', sans-serif;
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
    background-color: #dadada;
`
