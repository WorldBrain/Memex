import { colorBrandMintGreen } from 'src/common-ui/components/design-library/colors'
import colors from './colors'

export const fonts = {
    primary: {
        name: 'Poppins',
        colors: {
            primary: colors.fonts.primary,
            secondary: colors.fonts.secondary,
        },
        weight: {
            normal: 'normal',
            bold: 700,
        },
    },
}

const styles = {
    fonts,
    boxShadow: {
        overlayElement: '0px 0px 4.20px rgba(0, 0, 0, 0.14)',
    },
    borderRadius: {
        light: '2.1px',
        medium: '3px',
    },
    components: {
        sidebar: {
            widthPx: 173,
        },
        searchBar: {
            widthPx: 540,
        },
        syncStatusIcon: {
            colors: {
                green: colorBrandMintGreen,
                yellow: '#FAFF00',
                red: '#DF1313',
            },
        },
    },
}

export default styles
