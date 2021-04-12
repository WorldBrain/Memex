import { MemexTheme as Theme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import * as icons from 'src/common-ui/components/design-library/icons'

export const theme: Theme = {
    spacing: {
        none: '0',
        smallest: '0.25rem',
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
        largest: '3rem',
    },
    colors: {
        background: 'white',
        warning: 'red',
        primary: '#3a2f45',
        subText: '#aeaeae',
        purple: '#5671cf',
        lightgrey: '#f0f0f0',
        darkgrey: '#545454',
        secondary: '#5cd9a6',
        grey: '#e0e0e0',
        black: '000',
        lightblack: '#2c2c2c',
        overlay: {
            background: 'rgba(0, 0, 0, 0.1)',
            dialog: 'white',
        },
    },
    fonts: {
        primary: '"Poppins", sans-serif',
        secondary: '"Poppins", sans-serif',
    },
    fontWeights: {
        normal: 400,
        bold: 700,
    },
    hoverBackgrounds: {
        primary: '#e0e0e0',
    },
    borderRadii: {
        default: '3px',
    },
    fontSizes: {
        header: '20px',
        listTitle: '16px',
        url: '14px',
        text: '12px',
        smallText: '8px',
    },
    lineHeights: {
        header: '30px',
        listTitle: '24px',
        url: '21px',
        text: '18px',
        smallText: '12px',
    },
    zIndices: {
        overlay: 50,
    },
    icons: {
        copy: icons.copy,
        removeX: icons.removeX,
        hamburger: icons.hamburger,
        addPeople: icons.addPeople,
        checkRound: icons.checkRound,
        alertRound: icons.alertRound,
        triangle: icons.triangle,
        lock: icons.lock,
        person: icons.shared,
        shared: icons.shared,
        webLogo: icons.webLogo,
        mediumLogo: icons.mediumLogo,
        twitterLogo: icons.twitterLogo,
        substackLogo: icons.substackLogo,
        webMonetizationLogo: icons.webMonetizationLogo,
        webMonetizationLogoConfirmed: icons.webMonetizationLogoConfirmed,
    },
}
