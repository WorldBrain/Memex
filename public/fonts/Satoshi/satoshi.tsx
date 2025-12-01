import { createGlobalStyle } from 'styled-components'
import SatoshiBlackItalic from './Satoshi-BlackItalic.woff?url'
import SatoshiBlack from './Satoshi-Black.woff?url'
import SatoshiBold from './Satoshi-Bold.woff?url'
import SatoshiBoldItalic from './Satoshi-BoldItalic.woff?url'
import SatoshiItalic from './Satoshi-Italic.woff?url'
import SatoshiLight from './Satoshi-Light.woff?url'
import SatoshiLightItalic from './Satoshi-LightItalic.woff?url'
import SatoshiMedium from './Satoshi-Medium.woff?url'
import SatoshiMediumItalic from './Satoshi-MediumItalic.woff?url'
import SatoshiRegular from './Satoshi-Regular.woff?url'

import SatoshiVariable from './Satoshi-Variable.woff?url'
import SatoshiVariableItalic from './Satoshi-VariableItalic.woff?url'

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
