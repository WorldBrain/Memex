import { createGlobalStyle } from 'styled-components'

const InterThin = require('./Inter-Thin-BETA.woff')
const InterThinItalic = require('./Inter-ThinItalic-BETA.woff')
const InterExtraLight = require('./Inter-ExtraLight-BETA.woff')
const InterExtraLightItalic = require('./Inter-ExtraLightItalic-BETA.woff')
const InterLight = require('./Inter-Light-BETA.woff')
const InterLightItalic = require('./Inter-LightItalic-BETA.woff')
const InterRegular = require('./Inter-Regular.woff')
const InterItalic = require('./Inter-Italic.woff')
const InterMedium = require('./Inter-Medium.woff')
const InterMediumItalic = require('./Inter-MediumItalic.woff')
const InterSemiBold = require('./Inter-SemiBold.woff')
const InterSemiBoldItalic = require('./Inter-SemiBoldItalic.woff')
const InterBold = require('./Inter-Bold.woff')
const InterBoldItalic = require('./Inter-BoldItalic.woff')
const InterExtraBold = require('./Inter-ExtraBold.woff')
const InterExtraBoldItalic = require('./Inter-ExtraBoldItalic.woff')
const InterBlack = require('./Inter-Black.woff')
const InterBlackItalic = require('./Inter-BlackItalic.woff')

export default createGlobalStyle`
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 100;
        src: url(${InterThin}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 100;
        src: url(${InterThinItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 200;
        src: url(${InterExtraLight}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 200;
        src: url(${InterExtraLightItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 300;
        src: url(${InterLight}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 300;
        src: url(${InterLightItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 400;
        src: url(${InterRegular}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 400;
        src: url(${InterItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 500;
        src: url(${InterMedium}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 500;
        src: url(${InterMediumItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 600;
        src: url(${InterSemiBold}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 600;
        src: url(${InterSemiBoldItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 700;
        src: url(${InterBold}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 700;
        src: url(${InterBoldItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 800;
        src: url(${InterExtraBold}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 800;
        src: url(${InterExtraBoldItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Inter';
        font-style:  normal;
        font-weight: 900;
        src: url(${InterBlack}) format("woff");
    }
    @font-face {
        font-family: 'Inter';
        font-style:  italic;
        font-weight: 900;
        src: url(${InterBlackItalic}) format("woff");
    }
  `
