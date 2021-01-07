import { MemexTheme as Theme } from '@worldbrain/memex-common/lib/common-ui/styles/types'

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
        secondary: '#5cd9a6',
        grey: '#e0e0e0',
        black: '000',
        overlay: {
            background: 'rgba(0, 0, 0, 0.1)',
            dialog: 'white',
        },
    },
    fonts: {
        primary: '"Poppins", sans-serif',
        secondary: '"Poppins", sans-serif',
    },
    hoverBackgrounds: {
        primary: '#e0e0e0',
    },
    borderRadii: {
        default: '3px',
    },
    fontSizes: {
        listTitle: '16px',
        url: '14px',
    },
    zIndices: {
        overlay: 50,
    },
}
