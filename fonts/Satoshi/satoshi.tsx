import { createGlobalStyle } from 'styled-components'
const SatoshiBlackItalic = require('./Satoshi-BlackItalic.woff')
const SatoshiBlack = require('./Satoshi-Black.woff')
const SatoshiBold = require('./Satoshi-Bold.woff')
const SatoshiBoldItalic = require('./Satoshi-BoldItalic.woff')
const SatoshiItalic = require('./Satoshi-Italic.woff')
const SatoshiLight = require('./Satoshi-Light.woff')
const SatoshiLightItalic = require('./Satoshi-LightItalic.woff')
const SatoshiMedium = require('./Satoshi-Medium.woff')
const SatoshiMediumItalic = require('./Satoshi-MediumItalic.woff')
const SatoshiRegular = require('./Satoshi-Regular.woff')

const SatoshiVariable = require('./Satoshi-Variable.woff')
const SatoshiVariableItalic = require('./Satoshi-VariableItalic.woff')

export default createGlobalStyle`
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 100;
        src: url(${SatoshiVariable}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 100;
        src: url(${SatoshiVariableItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 300;
        src: url(${SatoshiLight}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 300;
        src: url(${SatoshiLightItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 400;
        src: url(${SatoshiRegular}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 400;
        src: url(${SatoshiItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 500;
        src: url(${SatoshiMedium}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 500;
        src: url(${SatoshiMediumItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 700;
        src: url(${SatoshiBold}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 700;
        src: url(${SatoshiBoldItalic}) format("woff");
    }
    
    @font-face {
        font-family: 'Satoshi';
        font-style:  normal;
        font-weight: 900;
        src: url(${SatoshiBlack}) format("woff");
    }
    @font-face {
        font-family: 'Satoshi';
        font-style:  italic;
        font-weight: 900;
        src: url(${SatoshiBlackItalic}) format("woff");
    }
  `
